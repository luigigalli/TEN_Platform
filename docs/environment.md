import { validateDeploymentEnvironment } from './config/deployment-validator';

// In your server initialization
await validateDeploymentEnvironment();