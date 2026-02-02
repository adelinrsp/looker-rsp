#!/bin/bash

# Generate .env.local from Netlify environment variables at build time
cat > .env.local << EOF
VITE_GOOGLE_SCRIPT_URL=$VITE_GOOGLE_SCRIPT_URL
VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
VITE_FACEBOOK_ACCESS_TOKEN=$VITE_FACEBOOK_ACCESS_TOKEN
VITE_FACEBOOK_AD_ACCOUNT_ID=$VITE_FACEBOOK_AD_ACCOUNT_ID
VITE_FACEBOOK_PAGE_ID=$VITE_FACEBOOK_PAGE_ID
EOF

echo "✓ .env.local generated from Netlify variables"
echo "Building app..."

# Run Vite build
npm run build
