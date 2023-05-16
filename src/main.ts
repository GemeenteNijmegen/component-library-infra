import { App } from 'aws-cdk-lib';
import { PipelineStack } from './PipelineStack';
import { Statics } from './Statics';

const deploymentEnvironment = {
  account: '418648875085',
  region: 'eu-west-1',
};

const env = {
  account: '799049117469',
  region: 'eu-west-1',
};

export const app = new App();

new PipelineStack(app, 'idcontact', {
  projectName: Statics.projectName,
  repository: `${Statics.repositoryOwner}/${Statics.repository}`,
  env: deploymentEnvironment,
  branchName: 'main',
  deployToEnvironment: env,
});


app.synth();