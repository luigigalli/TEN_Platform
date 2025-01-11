/// <reference types="jest" />

import { TestClient } from '../utils/test-client';

describe('Health Check API', () => {
  let client: TestClient;

  beforeAll(async () => {
    client = new TestClient();
    await client.initialize();
  });

  afterAll(async () => {
    await client.close();
  });

  it('should return 200 OK', async () => {
    const response = await client.get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
