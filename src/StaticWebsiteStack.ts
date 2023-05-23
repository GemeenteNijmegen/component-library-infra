import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudfrontDistribution } from './CloudfrontDistribution';
import { Configurable } from './Configuration';
import { WebsiteBucket } from './WebsiteBucket';
import { S3AccessUser } from './S3AccessUser';

interface StaticWebsiteStackProps extends StackProps, Configurable {}

export class StaticWebsiteStack extends Stack {
  constructor(scope: Construct, id: string, props: StaticWebsiteStackProps) {
    super(scope, id, props);
    const bucket = new WebsiteBucket(this, 'site');
    new S3AccessUser(this, 'user', { bucket: bucket.s3OriginConfig.s3BucketSource });
    new CloudfrontDistribution(this, 'cfdistr', {
      env: props.env,
      bucket: bucket.s3OriginConfig.s3BucketSource,
      originConfig: bucket.s3OriginConfig,
      configuration: props.configuration,
    });
  }
}
