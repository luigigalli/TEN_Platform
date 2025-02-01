import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../app';

describe('Routes', () => {
  let app: Express.Application;
  let server: any;

  before(async () => {
    const result = await createApp();
    app = result.app;
    server = result.server;
  });

  after(() => {
    server.close();
  });

  describe('GET /', () => {
    it('should return Hello World!', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.text).to.equal('Hello World!');
    });
  });

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).to.deep.equal({ status: 'ok' });
    });
  });
});
