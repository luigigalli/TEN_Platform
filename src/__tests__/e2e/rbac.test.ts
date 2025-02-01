import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { chromium, Browser, Page } from 'playwright';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';

describe('RBAC E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  let server: any;
  let adminUser: any;
  let regularUser: any;

  before(async () => {
    // Start server
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(3000, resolve));

    // Launch browser
    browser = await chromium.launch();
    page = await browser.newPage();

    // Create test users
    const prisma = new PrismaClient();
    
    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: 'password',
        fname: 'Admin',
        lname: 'User',
        roles: {
          create: {
            role: {
              create: {
                name: 'admin',
                permissions: {
                  create: [
                    { name: 'user:read' },
                    { name: 'user:write' },
                    { name: 'role:read' },
                    { name: 'role:write' }
                  ]
                }
              }
            }
          }
        }
      }
    });

    // Create regular user
    regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: 'password',
        fname: 'Regular',
        lname: 'User',
        roles: {
          create: {
            role: {
              create: {
                name: 'user',
                permissions: {
                  create: [
                    { name: 'user:read' }
                  ]
                }
              }
            }
          }
        }
      }
    });

    await prisma.$disconnect();
  });

  after(async () => {
    // Clean up
    const prisma = new PrismaClient();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.$disconnect();

    await browser.close();
    await new Promise<void>((resolve) => server.close(resolve));
  });

  describe('Admin User', () => {
    it('should have access to all admin features', async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'password');
      await page.click('button[type="submit"]');

      // Wait for dashboard to load
      await page.waitForSelector('#dashboard');

      // Check if admin features are visible
      const usersButton = await page.$('#users-button');
      const rolesButton = await page.$('#roles-button');
      const settingsButton = await page.$('#settings-button');

      expect(usersButton).to.exist;
      expect(rolesButton).to.exist;
      expect(settingsButton).to.exist;
    });
  });

  describe('Regular User', () => {
    it('should have limited access to features', async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', 'user@test.com');
      await page.fill('input[name="password"]', 'password');
      await page.click('button[type="submit"]');

      // Wait for dashboard to load
      await page.waitForSelector('#dashboard');

      // Check if admin features are not visible
      const usersButton = await page.$('#users-button');
      const rolesButton = await page.$('#roles-button');
      const settingsButton = await page.$('#settings-button');

      expect(usersButton).to.be.null;
      expect(rolesButton).to.be.null;
      expect(settingsButton).to.be.null;
    });
  });
});
