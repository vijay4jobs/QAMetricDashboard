#!/bin/sh

echo "=== Starting QA Metrics Dashboard ==="

# Run migrations with error handling (don't exit on error)
echo "Running database migrations..."
npm run migrate || {
  EXIT_CODE=$?
  echo "⚠ Migration exited with code $EXIT_CODE"
  echo "⚠ Continuing to start application..."
  echo "  (This is normal if migrations were already applied or database is not ready)"
}

# Start the application (this should never exit unless app crashes)
echo "Starting application..."
echo "=== Application starting on port ${PORT:-3000} ==="
exec npm start

