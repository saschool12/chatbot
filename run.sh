#!/usr/bin/env bash
# ==============================================================================
# NovaChat - Run Script for Spring Boot Backend
# ==============================================================================

set -e

echo "🚀 Starting NovaChat Spring Boot Application..."

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if Maven is installed, otherwise fallback to ./mvnw
if command -v mvn &> /dev/null; then
    echo "📦 Building with Maven..."
    mvn clean package -DskipTests
    echo "✨ Launching Spring Boot server..."
    java -jar target/chatbot-backend-1.0.0.jar
elif [ -f "./mvnw" ]; then
    echo "📦 Building with Maven Wrapper..."
    ./mvnw clean package -DskipTests
    echo "✨ Launching Spring Boot server..."
    java -jar target/chatbot-backend-1.0.0.jar
else
    echo "❌ Neither mvn nor ./mvnw found! Please install Maven or Java 17+."
    exit 1
fi
