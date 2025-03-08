/**
 * This file is used to validate required environment variables for deployment
 * It will be run as part of the deployment process
 */

const requiredEnvVars = [
  'NODE_ENV',
  'MONGODB_URI',
  'PORT'
];

function validateEnv() {
  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.error('Error: Missing required environment variables:');
    console.error(missing.join(', '));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateEnv();
}

module.exports = { validateEnv, requiredEnvVars };
