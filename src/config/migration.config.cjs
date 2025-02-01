const { DataSource } = require('typeorm');
require('dotenv').config();
const { join } = require('path');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ten_platform',
  entities: [join(__dirname, '../../dist/models/**/*.js')],
  migrations: [join(__dirname, '../../dist/migrations/**/*.js')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  extra: {
    ssl: false
  }
});

module.exports = AppDataSource;
