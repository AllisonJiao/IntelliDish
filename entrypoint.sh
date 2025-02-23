#!/bin/sh
echo "Checking if .env exists..."
if [ -f "/app/.env" ]; then
    echo ".env file found!"
else
    echo ".env file missing!"
    exit 1
fi

echo "Loading environment variables from .env"
export $(grep -v '^#' /app/.env | xargs)

echo "Verifying DB_URI..."
echo "DB_URI = $DB_URI"

if [ -z "$DB_URI" ]; then
    echo "DB_URI is still empty! Exiting..."
    exit 1
fi

echo "Starting the application..."
exec npm start  # or `node index.js` depending on your setup
