import { App } from 'aws-cdk-lib';
import { getConfiguration } from './Configuration';
import { PipelineStack } from './PipelineStack';
import { Statics } from './Statics';

const deploymentEnvironment = {
  account: '836443378780',
  region: 'eu-central-1',
};

export const app = new App();

new PipelineStack(app, 'component-library-development', {
  projectName: Statics.projectName,
  repository: `${Statics.repositoryOwner}/${Statics.repository}`,
  env: deploymentEnvironment,
  branchName: 'development',
  configuration: getConfiguration('development'),
});


app.synth();
