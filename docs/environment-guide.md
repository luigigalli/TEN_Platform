{
  "defaultPort": 3001,
  "host": "0.0.0.0",
  "requiredVars": ["REPL_ID", "REPL_SLUG"],
  "database": {
    "urlPrefix": "postgres://",
    "requireSSL": true,
    "poolConfig": {
      "maxConnections": 10,
      "idleTimeout": 60
    }
  }
}