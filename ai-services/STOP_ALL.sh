#!/bin/bash

# Script to stop all AI services

echo "🛑 Stopping all AI services..."

services=("duplicate-engine" "address-engine" "deceased-engine" "document-engine" "forgery-engine" "biometric-engine")

for service in "${services[@]}"; do
    pid_file="ai-services/${service}.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid
            echo "✅ Stopped $service (PID: $pid)"
        else
            echo "⚠️  $service not running"
        fi
        rm -f "$pid_file"
    else
        echo "⚠️  PID file not found for $service"
    fi
done

# Also kill any remaining uvicorn processes
pkill -f "uvicorn main:app" 2>/dev/null

echo ""
echo "✅ All AI services stopped!"

