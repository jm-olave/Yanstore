/**
 * Validates required environment variables
 * Logs warnings if any required variables are missing
 */

// Define required environment variables
const REQUIRED_ENV_VARS = [
    'VITE_API_URL',
  ];
  
  /**
   * Validates that all required environment variables are set
   * Logs warnings for any missing variables
   * @returns {boolean} - Whether all required variables are set
   */
  export const validateEnv = () => {
    const missingVars = [];
    
    REQUIRED_ENV_VARS.forEach(varName => {
      if (!import.meta.env[varName]) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      console.warn(
        `⚠️ Missing environment variables: ${missingVars.join(', ')}. ` +
        `Check that you have an .env file with these defined.`
      );
      return false;
    }
    
    return true;
  };
  
  /**
   * Gets current environment (development, production, etc.)
   * @returns {string} Current environment
   */
  export const getEnvironment = () => {
    return import.meta.env.MODE || 'development';
  };
  
  /**
   * Logs current environment configuration
   */
  export const logEnvironmentInfo = () => {
    const env = getEnvironment();
    console.info(`🌍 Running in ${env} environment`);
    
    if (env === 'development') {
      console.info(`🔗 API URL: ${import.meta.env.VITE_API_URL}`);
    }
  };
  
  export default {
    validateEnv,
    getEnvironment,
    logEnvironmentInfo
  };