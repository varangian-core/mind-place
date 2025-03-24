#!/bin/bash

# MindPlace Installation Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo -e "${RED}Error: Do not run this script as root.${NC}"
  exit 1
fi

# Check for required commands
command -v docker >/dev/null 2>&1 || {
  echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
  exit 1
}

command -v docker-compose >/dev/null 2>&1 || {
  echo -e "${RED}Error: docker-compose is not installed. Please install it first.${NC}"
  exit 1
}

# Create secure config directory
CONFIG_DIR="${HOME}/.config/mindplace"
mkdir -p "${CONFIG_DIR}"
chmod 700 "${CONFIG_DIR}"

# Generate secure credentials
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
APP_SECRET=$(openssl rand -base64 64)

# Create secure config file
CONFIG_FILE="${CONFIG_DIR}/secrets.env"
cat > "${CONFIG_FILE}" <<EOL
# MindPlace Secure Configuration
# This file contains sensitive information - keep it secure!

# Database Configuration
POSTGRES_USER=mindplace
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=mindplace

# Application Configuration
DATABASE_URL=postgresql://mindplace:${DB_PASSWORD}@db:5432/mindplace
APP_SECRET=${APP_SECRET}
EOL

# Set secure permissions
chmod 600 "${CONFIG_FILE}"

# Update docker-compose to use secure config
sed -i.bak "s|CONFIG_FILE=.*|CONFIG_FILE=${CONFIG_FILE}|" docker-compose.yml

# Create .env file for local development
cat > ../.env <<EOL
# MindPlace Local Development Configuration
DATABASE_URL=postgresql://mindplace:${DB_PASSWORD}@db:5432/mindplace
APP_SECRET=${APP_SECRET}
EOL

# Build and start containers
echo -e "${YELLOW}Starting MindPlace installation...${NC}"
docker-compose build || {
  echo -e "${RED}Error: Failed to build Docker containers${NC}"
  exit 1
}

docker-compose up -d || {
  echo -e "${RED}Error: Failed to start Docker containers${NC}"
  exit 1
}

# Wait for services to become healthy
echo -e "${YELLOW}Waiting for services to start...${NC}"
MAX_WAIT=120
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
  APP_STATUS=$(docker inspect -f '{{.State.Health.Status}}' mindplace_app 2>/dev/null)
  DB_STATUS=$(docker inspect -f '{{.State.Status}}' mindplace_db 2>/dev/null)
  
  if [ "$APP_STATUS" = "healthy" ] && [ "$DB_STATUS" = "running" ]; then
    break
  fi
  
  sleep 5
  WAITED=$((WAITED + 5))
  echo -ne "${YELLOW}.${NC}"
done

if [ "$APP_STATUS" != "healthy" ] || [ "$DB_STATUS" != "running" ]; then
  echo -e "\n${RED}Error: Services failed to start within $MAX_WAIT seconds${NC}"
  echo -e "App status: ${APP_STATUS:-unknown}"
  echo -e "DB status: ${DB_STATUS:-unknown}"
  echo -e "Check logs with: docker-compose logs"
  exit 1
fi

echo -e "\n${GREEN}Installation complete!${NC}"
echo -e "Access MindPlace at: ${YELLOW}http://localhost:3000${NC}"
echo -e "\nImportant:"
echo -e " - Your database password is stored in: ${YELLOW}${CONFIG_FILE}${NC}"
echo -e " - Keep this file secure!"
echo -e " - To stop the application: ${YELLOW}docker-compose down${NC}"
