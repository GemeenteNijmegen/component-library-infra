import { Environment as CdkEnvironment } from 'aws-cdk-lib';

export interface Configurable {
  readonly configuration: Configuration;
}

/**
 * Make account and region required
 */
export interface Environment extends CdkEnvironment {
  account: string;
  region: string;
}

export interface Configuration {
  readonly deployFromEnvironment: Environment;
  readonly deployToEnvironment: Environment;

  /**
   * The branch name this configuration is used for
   */
  readonly branchName: string;

  /**
   * If set a certificate for <value>.nijmegen.nl will be
   * generated in acm. This domain is also used in the
   * cloudfront domain names.
   * Note: enabling required adding cname records to nijmegen.nl
   */
  readonly alternativeDomains?: string[];

  /**
   * includePipelineValidationChcks
   */
  readonly includePipelineValidationChecks: boolean;

  /**
   * Subdomain for the hosted zone
   */
  readonly subdomain: string;

  /**
   * A list of CNAME records to register in the hosted zone
   * Note: key should be withou domain suffix (only subdomain).
   */
  readonly cnameRecords?: {[key: string]: string};

  /**
   * Add an IAM user with access key with full access rights to
   * the S3 Bucket.
   */
  readonly iamUserAccess: boolean;

  /**
   * The new landingzone has some specific requirements (the permissions
   * boundary aspect for instance). If this is deploying to the old LZ,
   * set the flag:
   */
  readonly oldLandingZone?: boolean;

}

export function getConfiguration(branchName: string): Configuration {
  if (Object.keys(configurations).includes(branchName)) {
    return configurations[branchName];
  }
  throw Error(`No configuration found for branch name ${branchName}`);
}

const configurations: { [name: string] : Configuration } = {
  development: {
    branchName: 'development',
    deployFromEnvironment: {
      account: '836443378780',
      region: 'eu-central-1',
    },
    deployToEnvironment: {
      account: '598242258242',
      region: 'eu-central-1',
    },
    subdomain: 'componenten-dev',
    includePipelineValidationChecks: false,
    iamUserAccess: false,
    // cnameRecords: {
    //   _2efd09bc809f1129572f073cb0873936: '_37726a837615087fa929e1970e5ad7c2.hsmgrxbjqd.acm-validations.aws',
    // },
  },
  sandbox: {
    branchName: 'sandbox',
    deployFromEnvironment: {
      account: '418648875085',
      region: 'eu-west-1',
    },
    deployToEnvironment: {
      account: '122467643252',
      region: 'eu-west-1',
    },
    subdomain: 'componenten-dev',
    includePipelineValidationChecks: false,
    iamUserAccess: true,
    oldLandingZone: true,
    // cnameRecords: {
    //   _2efd09bc809f1129572f073cb0873936: '_37726a837615087fa929e1970e5ad7c2.hsmgrxbjqd.acm-validations.aws',
    // },
  },
};
