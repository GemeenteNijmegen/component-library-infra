import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CacheBuster } from './CacheBuster';
import { CloudfrontDistribution } from './CloudfrontDistribution';
import { Configurable } from './Configuration';
import { S3AccessUser } from './S3AccessUser';
import { WebsiteBucket } from './WebsiteBucket';

interface StaticWebsiteStackProps extends StackProps, Configurable {
}

export class StaticWebsiteStack extends Stack {
  constructor(scope: Construct, id: string, props: StaticWebsiteStackProps) {
    super(scope, id, props);
    const bucket = new WebsiteBucket(this, 'site');
    const distribution = new CloudfrontDistribution(this, 'cfdistr', {
      env: props.env,
      bucket: bucket.s3OriginConfig.s3BucketSource,
      originConfig: bucket.s3OriginConfig,
      configuration: props.configuration,
    });
    new S3AccessUser(this, 'user', { bucket: bucket.s3OriginConfig.s3BucketSource });
    new CacheBuster(this, 'cachebuster', {
      bucket: bucket.s3OriginConfig.s3BucketSource,
      distribution: distribution.distribution,
      triggerKeys: [
        'index.html',
      ],
      environment: props.configuration.branchName == 'main' ? 'production' : 'acceptance',
    });
  }
}
