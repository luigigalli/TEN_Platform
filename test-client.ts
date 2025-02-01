import supertest from "supertest";
import { type Server } from "http";
import { createApp } from "../../server/app";

export class TestClient {
  private server!: Server;
  private request!: ReturnType<typeof supertest>;

  constructor() {
    // Initialize is called explicitly in tests
  }

  public async initialize() {
    const { app, server } = await createApp();
    this.server = server;
    this.request = supertest(app);
  }

  public async get(path: string) {
    return this.request.get(path);
  }

  public async post(path: string, body?: any) {
    return this.request.post(path).send(body);
  }

  public async put(path: string, body?: any) {
    return this.request.put(path).send(body);
  }

  public async delete(path: string) {
    return this.request.delete(path);
  }

  public async close() {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => resolve());
      });
    }
  }
}
