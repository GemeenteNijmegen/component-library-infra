import { RemoteParameters } from '@gemeentenijmegen/cross-region-parameters';
import { DnssecRecordStruct } from '@gemeentenijmegen/dnssec-record';
import { Duration, aws_route53 as Route53, aws_ssm as SSM, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { Statics } from './Statics';

export interface DNSSECStackProps extends StackProps, Configurable {}

export class DNSSECStack extends Stack {

  /**
   * Add DNSSEC using a new KMS key to the domain.
   * The key needs to be created in us-east-1. It only adds
   * DNSSEC to the zone for this project. The parent zone needs
   * to have DNSSEC enabled as well.
   *
   * @param scope Construct
   * @param id stack id
   * @param props props object
   */
  constructor(scope: Construct, id: string, props: DNSSECStackProps) {
    super(scope, id, props);

    // Import account root hosted zone
    const rootZoneParams = new RemoteParameters(this, 'root-zone-params', {
      path: Statics.accountRootHostedZonePath,
      region: props.configuration.deployToEnvironment.region,
      timeout: Duration.seconds(10),
    });
    const accountRootZone = Route53.HostedZone.fromHostedZoneAttributes(this, 'account-root-zone', {
      hostedZoneId: rootZoneParams.get(Statics.accountRootHostedZoneId),
      zoneName: rootZoneParams.get(Statics.accountRootHostedZoneName),
    });

    // Import project hosted zone
    const zone = this.importProjectHostedZone(this, props.configuration.deployToEnvironment.region);

    // Setup DNSSEC
    this.setDNSSEC(zone, accountRootZone);
  }

  setDNSSEC(hostedZone: Route53.IHostedZone, accountRootZone: Route53.IHostedZone) {

    // KSK
    const accountDnssecKmsKeyArn = SSM.StringParameter.valueForStringParameter(this, Statics.ssmAccountDnsSecKmsKey);
    const dnssecKeySigning = new Route53.CfnKeySigningKey(this, 'dnssec-keysigning-key', {
      name: 'app_ksk',
      status: 'ACTIVE',
      hostedZoneId: hostedZone.hostedZoneId,
      keyManagementServiceArn: accountDnssecKmsKeyArn,
    });

    // Enable DNSSEC
    const dnssec = new Route53.CfnDNSSEC(this, 'dnssec', {
      hostedZoneId: hostedZone.hostedZoneId,
    });
    dnssec.node.addDependency(dnssecKeySigning);

    // DS record
    const dnssecRecord = new DnssecRecordStruct(this, 'dnssec-record', {
      keySigningKey: dnssecKeySigning,
      hostedZone: hostedZone,
      parentHostedZone: accountRootZone,
    });
    dnssecRecord.node.addDependency(dnssec);
  }

  /**
   * Will import the project hosted zone
   * @param scope
   * @param fromRegion
   * @returns project hosted zone
   */
  importProjectHostedZone(scope: Construct, fromRegion: string) {
    const zoneParams = new RemoteParameters(scope, 'zone-params', {
      path: Statics.ssmZonePath,
      region: fromRegion,
      timeout: Duration.seconds(10),
    });
    return Route53.HostedZone.fromHostedZoneAttributes(scope, 'zone', {
      hostedZoneId: zoneParams.get(Statics.ssmZoneId),
      zoneName: zoneParams.get(Statics.ssmZoneName),
    });
  }
}
