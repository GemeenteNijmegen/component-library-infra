export abstract class Statics {
  static readonly projectName: string = 'component-library';

  /**
   * Repo information
   */

  static readonly repository: string = 'component-library-infra';
  static readonly repositoryOwner: string = 'GemeenteNijmegen';

  static readonly certificatePath: string = `/${this.projectName}/certificates`;
  static readonly certificateArn: string = `/${this.projectName}/certificates/certificate-arn`;

  static readonly ssmZonePath: string = `/${this.projectName}/zone`;
  static readonly ssmZoneId: string = `/${this.projectName}/zone/id`;
  static readonly ssmZoneName: string = `/${this.projectName}/zone/name`;


  static readonly accountRootHostedZonePath: string = '/gemeente-nijmegen/account/hostedzone';
  static readonly accountRootHostedZoneId: string = '/gemeente-nijmegen/account/hostedzone/id';
  static readonly accountRootHostedZoneName: string = '/gemeente-nijmegen/account/hostedzone/name';
}
