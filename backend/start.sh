#!/bin/bash

# Start script for running both NestJS API and LiveKit Agent

echo "========================================="
echo "Starting Task AI Backend Services"
echo "========================================="

# Function to handle shutdown gracefully
cleanup() {
    echo "Shutting down services..."
    kill $API_PID $AGENT_PID 2>/dev/null
    wait $API_PID $AGENT_PID 2>/dev/null
    echo "Services stopped."
    exit 0
}

trap cleanup SIGTERM SIGINT

# Start NestJS API server in background
echo "[1] Starting NestJS API Server..."
node dist/main &
API_PID=$!
echo "    → API Server PID: $API_PID"

# Wait a moment for API to initialize
sleep 3

# Start LiveKit Agent worker in background
echo "[2] Starting LiveKit Agent Worker..."
node dist/livekit/agent.workers.js start &
AGENT_PID=$!
echo "    → Agent Worker PID: $AGENT_PID"

echo "========================================="
echo "✓ All services started successfully"
echo "  - API Server: http://localhost:3000"
echo "  - Agent Worker: Running"
echo "========================================="

# Wait for both processes
wait $API_PID $AGENT_PID

# If we reach here, one of the processes died
echo "ERROR: One of the services has stopped unexpectedly!"
exit 1
