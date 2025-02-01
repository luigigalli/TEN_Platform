/// <reference types="mocha" />

import { expect } from 'chai';
import { TestClient } from '../utils/test-client';

describe('Health Check API', () => {
  let client: TestClient;

  before(async () => {
    client = new TestClient();
    await client.initialize();
  });

  after(async () => {
    await client.close();
  });

  it('should return 200 OK', async () => {
    const response = await client.get('/api/health');
    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({ status: 'ok' });
  });
});
