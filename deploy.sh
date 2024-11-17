#!/bin/bash

# Build script for deployment

# Install dependencies
echo "Installing server dependencies..."
npm install

# Install client dependencies and build
echo "Installing and building client..."
cd client
npm install
npm run build
cd ..

# Create necessary directories
mkdir -p dist/client

# Copy built files to the correct location
echo "Copying build files..."
cp -r client/dist/* dist/client/

# Copy server files
echo "Copying server files..."
cp -r server/* dist/

# Copy package files
cp package.json dist/
cp package-lock.json dist/

echo "Build complete!"