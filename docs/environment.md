{
  name: 'windsurf',
  defaultPort: 3000,
  host: 'localhost',
  requiredVars: ['WINDSURF_ENV'],
  database: {
    urlPrefix: 'postgresql://',
    requireSSL: false,
    poolConfig: {
      maxConnections: 5,
      idleTimeout: 30
    }
  }
}