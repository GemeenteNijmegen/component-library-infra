import { App } from 'aws-cdk-lib';
import { getConfiguration } from './Configuration';
import { PipelineStack } from './PipelineStack';
import { Statics } from './Statics';

export const app = new App();

let branchName: string;
if (!process.env.BRANCH_NAME || process.env.BRANCH_NAME == 'development') {
  branchName = 'development';
} else {
  branchName = process.env.BRANCH_NAME;
}
const configuration = getConfiguration(branchName);
new PipelineStack(app, `component-library-${branchName}`, {
  projectName: Statics.projectName,
  repository: `${Statics.repositoryOwner}/${Statics.repository}`,
  env: configuration.deployFromEnvironment,
  branchName,
  configuration,
});

app.synth();
