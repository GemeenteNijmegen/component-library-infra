import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { EventType, IBucket } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import { CacheInvalidationFunction } from './CacheInvalidation/CacheInvalidation-function';

interface CacheBusterProps {
  bucket: IBucket;
  triggerKeys: string[];
  distribution: Distribution;
}
export class CacheBuster extends Construct {
  constructor(scope: Construct, id: string, props: CacheBusterProps) {
    super(scope, id);
    const lambda = this.createLambda(props.distribution);
    this.setupTrigger(props.bucket, props.triggerKeys, lambda);
  }

  createLambda(distribution: Distribution) {
    const lambda = new CacheInvalidationFunction(this, 'cacheInvalidator', {
      description: 'Invalidates a Cloudfront Cache. This is triggered by put events on a specific S3 key',
      environment: {
        CLOUDFRONT_DISTRIBUTION_ID: distribution.distributionId,
      },
    });
    distribution.grantCreateInvalidation(lambda.grantPrincipal);
    return lambda;
  }

  setupTrigger(bucket: IBucket, triggerKeys: string[], lambda: Function) {
    const filters = triggerKeys.map(key => { return { prefix: key }; });
    bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(lambda), ...filters);
  }
}
