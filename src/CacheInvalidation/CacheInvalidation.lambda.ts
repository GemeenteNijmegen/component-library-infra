import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { environmentVariables } from '@gemeentenijmegen/utils';
import { invalidateCommand } from './invalidate';

const client = new CloudFrontClient();

export async function handler() {
  const env = environmentVariables(['CLOUDFRONT_DISTRIBUTION_ID']);
  await client.send(invalidateCommand(env.CLOUDFRONT_DISTRIBUTION_ID));
}
