import { invalidateCommand } from '../invalidate';

test('creates cache invalidation', async() => {
  expect(invalidateCommand('ABCD1234')).toHaveProperty('input');
});
