import * as crypto from 'crypto';
import { aws_route53 as Route53, Stack, StackProps, aws_ssm as SSM } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { Statics } from './Statics';

export interface DNSStackProps extends StackProps, Configurable {}

export class DNSStack extends Stack {
  zone: Route53.HostedZone;
  accountRootZone: Route53.IHostedZone;

  constructor(scope: Construct, id: string, props: DNSStackProps) {
    super(scope, id);

    const rootZoneId = SSM.StringParameter.valueForStringParameter(this, Statics.accountRootHostedZoneId);
    const rootZoneName = SSM.StringParameter.valueForStringParameter(this, Statics.accountRootHostedZoneName);
    this.accountRootZone = Route53.HostedZone.fromHostedZoneAttributes(this, 'account-root-zone', {
      hostedZoneId: rootZoneId,
      zoneName: rootZoneName,
    });

    this.zone = new Route53.HostedZone(this, 'hosted-zone', {
      zoneName: `${props.configuration.subdomain}.${this.accountRootZone.zoneName}`,
    });

    this.addZoneIdAndNametoParams();
    this.addNSToRootCSPzone(props.configuration.subdomain);

    if (props.configuration.cnameRecords) {
      this.addCnameRecords(this.zone, props.configuration.cnameRecords);
    }

  }

  /**
   * Export zone id and name to parameter store
   * for use in other stages (Cloudfront).
   */
  private addZoneIdAndNametoParams() {
    new SSM.StringParameter(this, 'hostedzone-id', {
      stringValue: this.zone.hostedZoneId,
      parameterName: Statics.ssmZoneId,
    });

    new SSM.StringParameter(this, 'hostedzone-name', {
      stringValue: this.zone.zoneName,
      parameterName: Statics.ssmZoneName,
    });
  }

  /**
   * Add the Name servers from the newly defined zone to
   * the root zone for csp-nijmegen.nl. This will only
   * have an actual effect in the prod. account.
   *
   * @returns null
   */
  addNSToRootCSPzone(subdomain: string) {
    if (!this.zone.hostedZoneNameServers) { return; }
    new Route53.NsRecord(this, 'ns-record', {
      zone: this.accountRootZone,
      values: this.zone.hostedZoneNameServers,
      recordName: subdomain,
    });
  }

  /**
   * Add the CNAME records to the hosted zone that are
   * provided in the branch specific configuration
   * @param hostedZone the hosted zone to add the records to
   * @param cnameRecords configruation property containing the records
   */
  addCnameRecords(hostedZone: Route53.IHostedZone, cnameRecords: { [key: string]: string }) {
    Object.entries(cnameRecords).forEach(entry => {
      const logicalId = crypto.createHash('md5').update(entry[0]).digest('hex').substring(0, 10);
      new Route53.CnameRecord(this, `record-${logicalId}`, {
        zone: hostedZone,
        recordName: entry[0],
        domainName: entry[1],
      });
    });
  }

}
