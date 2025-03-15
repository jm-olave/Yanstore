Environment Configuration Guide
Overview
This project uses environment variables to configure the application for different environments (development, production, etc.).
Environment Files
The following environment files are used:

.env.development - Used for local development
.env.production - Used for production builds

Available Environment Variables
VariableDescriptionExampleVITE_API_URLBase URL for API callshttp://localhost:8000
How to Use
Development
For local development, run:
bashCopiarnpm run dev
This will use the .env.development file.
Production Build
For production builds, run:
bashCopiarnpm run build:prod
This will use the .env.production file.
How to Add New Environment Variables

Add the variable to the appropriate .env.* files
Import and use in your code with import.meta.env.VARIABLE_NAME

Example:
javascriptCopiarconst apiUrl = import.meta.env.VITE_API_URL;
Best Practices

Never commit sensitive information (like API keys) to the repository
Always use the VITE_ prefix for variables that need to be accessible in the frontend
Use the centralized API config (src/config/api.config.js) instead of directly using environment variables in components

Troubleshooting
If your environment variables are not working:

Make sure the variable names start with VITE_
Restart the development server after changing environment files
Check that you're using the correct environment mode when running the app