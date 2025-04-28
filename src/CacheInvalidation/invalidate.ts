import { CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

export function invalidateCommand(distributionId: string) {
  const command = new CreateInvalidationCommand({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: process.env.AWS_LAMBDA_FUNCTION_NAME,
      Paths: {
        Quantity: 2,
        Items: [
          '/index.html',
          '/version.json',
        ],
      },
    },
  });
  return command;
}
