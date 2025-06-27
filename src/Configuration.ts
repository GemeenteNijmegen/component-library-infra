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
  readonly cnameRecords?: { [key: string]: string };

}

/**
 * Get a configuration object, based on the branchName you provide
 *
 * Checks the configurations object for a configuration with the 'branchName' key
 * matching the provided branch.
 *
 * @param branchName the branchName you're deploying
 * @returns the configuration object for the branhc
 */
export function getConfiguration(branchName: string): Configuration {
  const configName = Object.keys(configurations).find((configurationName) => {
    const config = configurations[configurationName];
    return config.branchName == branchName;
  });
  if (configName) {
    return configurations[configName];
  }
  throw Error(`No configuration found for branch name ${branchName}`);
}

const deploymentEnvironment = {
  account: '836443378780',
  region: 'eu-central-1',
};

const configurations: { [name: string]: Configuration } = {
  development: {
    branchName: 'development',
    deployFromEnvironment: deploymentEnvironment,
    deployToEnvironment: {
      account: '598242258242',
      region: 'eu-central-1',
    },
    subdomain: 'componenten-dev',
    includePipelineValidationChecks: false,
  },
  acceptance: {
    branchName: 'acceptance',
    deployFromEnvironment: deploymentEnvironment,
    deployToEnvironment: {
      account: '768900902886',
      region: 'eu-central-1',
    },
    subdomain: 'componenten-accp',
    alternativeDomains: ['componenten.acc.nijmegen.nl'],
    includePipelineValidationChecks: false,
  },
  production: {
    branchName: 'main',
    deployFromEnvironment: deploymentEnvironment,
    deployToEnvironment: {
      account: '706611162248',
      region: 'eu-central-1',
    },
    subdomain: 'componenten',
    alternativeDomains: ['componenten.nijmegen.nl'],
    includePipelineValidationChecks: false,
  },
};
