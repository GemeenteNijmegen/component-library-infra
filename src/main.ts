import { App } from 'aws-cdk-lib';
import { getConfiguration } from './Configuration';
import { PipelineStack } from './PipelineStack';
import { Statics } from './Statics';

export const app = new App();


if ('BRANCH_NAME' in process.env == false || process.env.BRANCH_NAME == 'development') {
  const config = getConfiguration('development');
  new PipelineStack(app, 'component-library-development', {
    projectName: Statics.projectName,
    repository: `${Statics.repositoryOwner}/${Statics.repository}`,
    env: config.deployFromEnvironment,
    branchName: 'development',
    configuration: config,
  });
} else if (process.env.BRANCH_NAME == 'sandbox') {
  const config = getConfiguration('sandbox');
  new PipelineStack(app, 'component-library-sandbox', {
    projectName: Statics.projectName,
    repository: `${Statics.repositoryOwner}/${Statics.repository}`,
    env: config.deployFromEnvironment,
    branchName: 'sandbox',
    configuration: config,
  });
}

app.synth();
