#!/bin/bash
export PYTHONPATH=/home/site/wwwroot
export PORT=$PORT

# Set default port if not provided
if [ -z "$PORT" ]; then
    PORT=8000
fi

# Start FastAPI application
python -m uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4 --ws websockets --ws-ping-interval 30 --ws-ping-timeout 30