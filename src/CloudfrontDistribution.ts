import path from 'path';
import { aws_ssm, Duration, Environment } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { AllowedMethods, CachePolicy, Distribution, Function, FunctionCode, FunctionEventType, HeadersFrameOption, HeadersReferrerPolicy, PriceClass, ResponseHeadersPolicy, S3OriginConfig, SecurityPolicyProtocol, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AaaaRecord, ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket, BucketEncryption, IBucket, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { RemoteParameters } from 'cdk-remote-stack';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { Statics } from './Statics';

interface CloudfrontDistributionProps extends Configurable {
  bucket: IBucket;
  originConfig: S3OriginConfig;
  env?: Environment;
}

export class CloudfrontDistribution extends Construct {
  public distribution: Distribution;
  constructor(scope: Construct, id: string, props: CloudfrontDistributionProps) {
    super(scope, id);

    const certificateArn = this.certificateArn();
    const certificate = (certificateArn) ? Certificate.fromCertificateArn(this, 'certificate', certificateArn) : undefined;
    const zoneId = aws_ssm.StringParameter.valueForStringParameter(this, Statics.ssmZoneId);
    const zoneName = aws_ssm.StringParameter.valueForStringParameter(this, Statics.ssmZoneName);
    const domainNames = props.configuration.alternativeDomains ? [zoneName, ...props.configuration.alternativeDomains] : [zoneName];

    this.distribution = new Distribution(this, 'cf-distribution', {
      priceClass: PriceClass.PRICE_CLASS_100,
      certificate,
      domainNames,
      defaultBehavior: {
        origin: new S3Origin(props.bucket, { originAccessIdentity: props.originConfig.originAccessIdentity }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [{ eventType: FunctionEventType.VIEWER_REQUEST, function: this.indexRewriteFunction() }],
        responseHeadersPolicy: this.responseHeadersPolicy(),
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      },
      logBucket: this.logBucket(),
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultRootObject: 'index.html',
    });

    this.addDnsRecords(this.distribution, zoneId, zoneName);

  }

  /**
   * Get the certificate ARN from parameter store in us-east-1
   * @returns string Certificate ARN
   */
  private certificateArn() {
    const parameters = new RemoteParameters(this, 'params', {
      path: `${Statics.certificatePath}/`,
      region: 'us-east-1',
      alwaysUpdate: true,
      timeout: Duration.seconds(10),
    });
    const certificateArn = parameters.get(Statics.certificateArn);
    return certificateArn;
  }

  private indexRewriteFunction() {
    return new Function(this, 'rewrite-index', {
      code: FunctionCode.fromFile({ filePath: path.join(__dirname, 'rewriteIndexFunction.js') }),
    });
  }

  /**
   * Create a bucket to hold cloudfront logs
   * @returns s3.Bucket
   */
  logBucket() {
    return new Bucket(this, 'CloudfrontLogs', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      eventBridgeEnabled: true,
      enforceSSL: true,
      encryption: BucketEncryption.S3_MANAGED,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      lifecycleRules: [
        {
          id: 'delete objects after 180 days',
          enabled: true,
          expiration: Duration.days(180),
        },
      ],
    });
  }

  /**
   * Add DNS records for cloudfront to the Route53 Zone
   *
   * Requests to the custom domain will correctly use cloudfront.
   *
   * @param distribution the cloudfront distribution
   */
  addDnsRecords(distribution: Distribution, hostedZoneId: string, hostedZoneName: string): void {
    const zone = HostedZone.fromHostedZoneAttributes(this, 'zone', {
      hostedZoneId: hostedZoneId,
      zoneName: hostedZoneName,
    });

    new ARecord(this, 'a-record', {
      zone: zone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    new AaaaRecord(this, 'aaaa-record', {
      zone: zone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    new ARecord(this, 'a-record-www', {
      zone: zone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      recordName: `www.${zone.zoneName}`,
    });

    new AaaaRecord(this, 'aaaa-record-www', {
      zone: zone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      recordName: `www.${zone.zoneName}`,
    });
  }

  /**
   * Get a set of (security) response headers to inject into the response
   * @returns {ResponseHeadersPolicy} cloudfront responseHeadersPolicy
   */
  responseHeadersPolicy(): ResponseHeadersPolicy {

    const responseHeadersPolicy = new ResponseHeadersPolicy(this, 'headers', {
      securityHeadersBehavior: {
        contentSecurityPolicy: { contentSecurityPolicy: this.cspHeaderValue(), override: true },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: HeadersReferrerPolicy.NO_REFERRER, override: true },
        strictTransportSecurity: { accessControlMaxAge: Duration.days(366), includeSubdomains: true, override: true },
      },
      corsBehavior: {
        accessControlAllowMethods: ['GET'],
        accessControlAllowOrigins: ['*'],
        accessControlAllowCredentials: false,
        accessControlAllowHeaders: ['*'],
        accessControlExposeHeaders: ['*'],
        accessControlMaxAge: Duration.seconds(0),
        originOverride: true,
      },
    });
    return responseHeadersPolicy;
  }

  /**
   * Get the cleaned, trimmed header values for the csp header
   *
   * @returns string csp header values
   */
  cspHeaderValue() {
    const cspValues = [
      'base-uri \'self\';',
      'default-src \'self\';',
      'frame-ancestors \'self\';',
      'frame-src \'self\';',
      'connect-src \'self\' https://public.pandosearch.com;',
      'form-action \'self\';',
      'style-src \'unsafe-inline\' \'self\' https://fonts.googleapis.com https://fonts.gstatic.com;',
      'script-src \'unsafe-inline\' \'self\' https://siteimproveanalytics.com;',
      'font-src \'self\' https://fonts.gstatic.com;',
      'img-src \'self\' https://mdbootstrap.com data: https://*.siteimproveanalytics.io;',
      'object-src \'none\';',
    ].join(' ');
    return cspValues.replace(/[ ]+/g, ' ').trim();
  }
}
