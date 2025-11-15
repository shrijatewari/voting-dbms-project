#!/bin/bash

# Script to start all AI services in development mode

echo "🚀 Starting all AI services..."

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local dir="ai-services/$service_name"
    
    if [ -d "$dir" ]; then
        echo "Starting $service_name on port $port..."
        cd "$dir"
        uvicorn main:app --host 0.0.0.0 --port $port --reload > "../${service_name}.log" 2>&1 &
        echo $! > "../${service_name}.pid"
        cd ../..
        echo "✅ $service_name started (PID: $(cat ai-services/${service_name}.pid))"
    else
        echo "❌ Directory $dir not found"
    fi
}

# Start all services
start_service "duplicate-engine" 8001
sleep 1
start_service "address-engine" 8002
sleep 1
start_service "deceased-engine" 8003
sleep 1
start_service "document-engine" 8004
sleep 1
start_service "forgery-engine" 8005
sleep 1
start_service "biometric-engine" 8006

echo ""
echo "✅ All AI services started!"
echo "📋 Service PIDs saved in ai-services/*.pid"
echo "📝 Logs available in ai-services/*.log"
echo ""
echo "To stop all services, run: ./STOP_ALL.sh"

