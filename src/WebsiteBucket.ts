import { RemovalPolicy } from 'aws-cdk-lib';
import { OriginAccessIdentity, S3OriginConfig } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class WebsiteBucket extends Construct {
  public readonly s3OriginConfig: S3OriginConfig;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const bucket = new Bucket(this, 'WebsiteBucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: `CloudFront OriginAccessIdentity for ${bucket.bucketName}`,
    });

    this.s3OriginConfig = {
      originAccessIdentity,
      s3BucketSource: bucket,
    };
    bucket.grantRead(originAccessIdentity);
  }
}
