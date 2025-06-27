import { CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

export function invalidateCommand(distributionId: string) {
  let items = invalidationItems(process.env.ENVIRONMENT);

  const command = new CreateInvalidationCommand({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `${Date.now()}`,
      Paths: {
        Quantity: items.length,
        Items: items,
      },
    },
  });
  return command;
}

function invalidationItems(environment?: string) {
  let items = [
    '/*',
  ];
  if (environment == 'production') {
    items = [
      '/index.html',
      '/version.json',
    ];
  }
  return items;
}
