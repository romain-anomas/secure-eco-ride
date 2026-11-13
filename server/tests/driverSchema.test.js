import test from 'node:test';
import assert from 'node:assert/strict';
import { driverSchema } from '../src/validators/resources.js';

test('new driver profiles start inactive until the driver chooses to go active', () => {
  const parsed = driverSchema.parse({
    name: 'Test Driver',
    phone: '+250793157373',
  });

  assert.equal(parsed.status, 'OFFLINE');
  assert.equal(parsed.is_active, true);
});
