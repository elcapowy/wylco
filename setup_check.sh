#!/bin/bash

echo "------------------------------------------------"
echo "CLIMACORE / WYLCO Antigravity - Environment Check"
echo "------------------------------------------------"

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    echo "✓ Node.js is installed: $NODE_VER"
else
    echo "✗ Node.js is NOT installed. Please install it from https://nodejs.org/"
    exit 1
fi

# Check NPM
if command -v npm >/dev/null 2>&1; then
    NPM_VER=$(npm -v)
    echo "✓ NPM is installed: $NPM_VER"
else
    echo "✗ NPM is NOT installed. Normally included with Node.js."
    exit 1
fi

# Check Directory Structure
if [ -d "backend" ]; then
    echo "✓ 'backend' directory found."
else
    echo "✗ 'backend' directory NOT found. Please run this script from the project root."
fi

if [ -f "Dashboard.html" ]; then
    echo "✓ 'Dashboard.html' found."
else
    echo "✗ 'Dashboard.html' NOT found."
fi

# Check .env
if [ -f "backend/.env" ]; then
    echo "✓ backend/.env found."
else
    echo "⚠ backend/.env NOT found. The backend will fail to start without its connection settings."
fi

echo "------------------------------------------------"
echo "Setup Check Complete."
echo "If all checks passed, run 'cd backend && npm install' to begin."
echo "------------------------------------------------"
