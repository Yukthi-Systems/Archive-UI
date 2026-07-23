#!/bin/sh

# Go to the app directory
cd /app

# Recreate the config file
rm -rf ./dist/env-config.js
touch ./dist/env-config.js

# Add assignment
echo "window._env_ = {" > ./dist/env-config.js

# Helper function to append variable
# Usage: append_var "VARIABLE_NAME"
append_var() {
  VAR_NAME=$1
  # Get value from environment, default to empty string if not set
  VAR_VALUE=$(eval echo \$$VAR_NAME)
  
  # Append to file with JS object syntax
  echo "  \"$VAR_NAME\": \"$VAR_VALUE\"," >> ./dist/env-config.js
}

# List of variables to include
append_var "VITE_API_URL"
append_var "VITE_EXPORT_API_URL"
append_var "VITE_WSS_URL"
append_var "VITE_API_KEY"
append_var "VITE_RECAPTCHA_SITE_KEY"
append_var "VITE_APP_VERSION"
append_var "VITE_ARCHIVE_DOMAIN"

# Close the JS object
echo "}" >> ./dist/env-config.js

# Execute the command passed to the script (e.g., serve)
exec "$@"