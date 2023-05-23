import { RemovalPolicy } from "aws-cdk-lib";
import { ManagedPolicy, PolicyStatement, Effect, User, AccessKey } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

interface S3AccessUserProps {
  bucket: IBucket;
}

export class S3AccessUser extends Construct {
  /**
   * A construct that creates an IAM user, which is
   * allowed access to a specific S3 Bucket.
   * 
   * @param props {S3AccessUserProps}
   */
  constructor(scope: Construct, id: string, props: S3AccessUserProps) {
    super(scope, id);
    
    const s3SingleBucketAccess = this.s3AccessPolicy(props.bucket);

    const user = this.user(s3SingleBucketAccess);
    this.addAccessKey(user);
  }

  /**
   * Create an IAM user and apply the provided access policy
   * 
   * @param {ManagedPolicy} s3SingleBucketAccess 
   * @returns {User}
   */
  private user(s3SingleBucketAccess: ManagedPolicy): User {
    const user = new User(this, 's3user', {
      managedPolicies: [s3SingleBucketAccess],
    });
    user.applyRemovalPolicy(RemovalPolicy.DESTROY);
    return user;
  }

  /**
   * Create an access key for the provided user, and store it
   * in secrets manager. (CDK-created access keys can not 
   * be accessed after creation).
   * 
   * @param user {User}
   */
  private addAccessKey(user: User) {
    const accessKey = new AccessKey(this, 's3-key', { user, serial: 1 });
    accessKey.applyRemovalPolicy(RemovalPolicy.DESTROY);

    new Secret(this, 's3-secret', {
      secretStringValue: accessKey.secretAccessKey,
      removalPolicy: RemovalPolicy.DESTROY,
      description: `access key secret for access key ${accessKey.accessKeyId}`
    });
  }

  /**
   * Create a managed policy that allows full access to a specific S3 bucket,
   * and disallows access to every other bucket.
   * 
   * @param bucket {IBucket} the bucket this policy allows access to
   * @returns {ManagedPolicy} 
   */
  private s3AccessPolicy(bucket: IBucket) {
    const s3SingleBucketAccess = new ManagedPolicy(this, 's3-specific-bucket-only-boundary',
      {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:*'],
            resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
          }),
          new PolicyStatement({
            effect: Effect.DENY,
            notActions: ['s3:*'],
            notResources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
          }),
        ],
      }
    );
    s3SingleBucketAccess.applyRemovalPolicy(RemovalPolicy.DESTROY);
    return s3SingleBucketAccess;
  }
}

