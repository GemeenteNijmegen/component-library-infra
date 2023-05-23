import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Configuration } from '../src/Configuration';
import { PipelineStack } from '../src/PipelineStack';
import { Statics } from '../src/Statics';

const snapshotEnv = {
  account: '123456789012',
  region: 'eu-central-1',
};

const config: Configuration = {
  branchName: 'snapshot-tests',
  deployToEnvironment: snapshotEnv,
  includePipelineValidationChecks: false,
  subdomain: 'component-library-unittest',
  deployFromEnvironment: {
    account: '123',
    region: 'et',
  },
  iamUserAccess: false,
};

test('Snapshot', () => {
  const app = new App();
  const stack = new PipelineStack(app, 'test', {
    projectName: Statics.projectName,
    repository: `${Statics.repositoryOwner}/${Statics.repository}`,
    env: {
      account: '123',
      region: 'eu-central-1',
    },
    branchName: 'main',
    configuration: config,
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
