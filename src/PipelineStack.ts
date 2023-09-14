import { PermissionsBoundaryAspect } from '@gemeentenijmegen/aws-constructs';
import { Stack, StackProps, Tags, pipelines, CfnParameter, Stage, StageProps, Aspects } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { DNSSECStack } from './DNSSECStack';
import { DNSStack } from './DNSStack';
import { StaticWebsiteStack } from './StaticWebsiteStack';
import { UsEastCertificateStack } from './UsEastCertificateStack';

export interface PipelineStackProps extends StackProps, Configurable {
  projectName: string;
  repository: string;
  branchName: string;
}

export class PipelineStack extends Stack {
  branchName: string;
  projectName: string;
  repository: string;
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    Tags.of(this).add('cdkManaged', 'yes');
    Tags.of(this).add('Project', props.projectName);
    Aspects.of(this).add(new PermissionsBoundaryAspect());

    this.branchName = props.branchName;
    this.projectName = props.projectName;
    this.repository = props.repository;

    const connectionArn = new CfnParameter(this, 'connectionArn');

    const source = this.connectionSource(connectionArn);

    const pipeline = this.pipeline(source);
    pipeline.addStage(
      new StaticWebsiteStage(this, 'component-library', {
        env: props.configuration.deployToEnvironment,
        configuration: props.configuration,
      }),
    );
  }

  pipeline(source: pipelines.CodePipelineSource): pipelines.CodePipeline {
    const synthStep = new pipelines.ShellStep('Synth', {
      input: source,
      env: {
        BRANCH_NAME: this.branchName,
      },
      commands: [
        'yarn install --frozen-lockfile',
        'npx projen build',
        'npx projen synth',
      ],
    });

    const pipeline = new pipelines.CodePipeline(this, `${this.projectName}-${this.branchName}`, {
      pipelineName: `${this.projectName}-${this.branchName}`,
      crossAccountKeys: true,
      synth: synthStep,
    });
    return pipeline;
  }

  private connectionSource(connectionArn: CfnParameter): pipelines.CodePipelineSource {
    return pipelines.CodePipelineSource.connection(this.repository, this.branchName, {
      connectionArn: connectionArn.valueAsString,
    });
  }
}

interface StaticWebsiteStageProps extends StageProps, Configurable {}

class StaticWebsiteStage extends Stage {
  constructor(scope: Construct, id: string, props: StaticWebsiteStageProps) {
    super(scope, id, props);
    Aspects.of(this).add(new PermissionsBoundaryAspect());

    const dnsStack = new DNSStack(this, 'dns', { configuration: props.configuration });

    const dnssecStack = new DNSSECStack(this, 'dnssec-stack', {
      env: { region: 'us-east-1' },
      configuration: props.configuration,
    });

    dnssecStack.addDependency(dnsStack);
    const staticWebsiteStack = new StaticWebsiteStack(this, 'site', { env: props.env, configuration: props.configuration });

    const certStack = new UsEastCertificateStack(this, 'cert-stack', {
      env: { account: this.account, region: 'us-east-1' },
      configuration: props.configuration,
    });
    certStack.addDependency(dnsStack, 'dns parameters must exist for cert stack');
    staticWebsiteStack.addDependency(certStack, 'certificate must be created before use');

  }
}
