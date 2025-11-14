#!/bin/sh

echo "Running database migrations..."
npm run migrate || {
  echo "⚠ Migration had errors, but continuing to start application..."
  echo "  (This is normal if migrations were already applied or database is not ready)"
}

echo "Starting application..."
exec npm start

