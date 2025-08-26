#!/bin/bash

# Check if EC2_HOST is set
if [ -z "$EC2_HOST" ]; then
    echo "Error: EC2_HOST environment variable is not set"
    echo "Please set it to your EC2 instance's public DNS or IP address"
    exit 1
fi

# Clean up 
echo "Removing .next and cached modules"
rm -rf .next 
rm -rf node_modules/.cache

# Build the Docker image
echo "Building Docker image..."
docker build --platform=linux/amd64 --no-cache -t ningbo-app:latest .

# Save the image to a tar file
echo "Saving Docker image..."
docker save ningbo-app:latest -o ningbo-app.tar

# Copy the image and .env.production to EC2
echo "Copying image  to EC2..."
scp -i /Users/petermekkelholt/Documents/keys/CC_USA.pem ningbo-app.tar  ec2-user@$EC2_HOST:~/

# SSH into EC2 and load the image
echo "Loading image on EC2..."
ssh -i /Users/petermekkelholt/Documents/keys/CC_USA.pem ec2-user@$EC2_HOST << 'ENDSSH'

    # Create and move into the ningbo directory
    mkdir -p ~/ningbo
    cd ~/ningbo

    #  Overwrite .tar file in ningbo directory
    mv ~/ningbo-app.tar .
    echo "Tar file moved to ningbo directory."
    # Move the tar file into the directory if it's not already there
    #if [ -f ~/ningbo/ningbo-app.tar ]; then
    #  echo "Tar file already in ningbo directory."
    #elif [ -f ~/ningbo-app.tar ]; then
    #  mv ~/ningbo-app.tar .
    #fi

    # Rename existing ningbo/.env 
    # Then move.env.production into ningbo/ and rename it .env
    #if [ -f ~/ningbo/.env ]; then
    #  # Rename existing .env to .env with timestamp
    #  timestamp=$(date +"%Y%m%d_%H%M%S")
    #   mv ~/ningbo/.env ~/ningbo/.env_$timestamp
    #  echo "Renamed existing .env to .env_$timestamp"
    #fi
    #if [ -f ~/.env.production ]; then
    #  mv ~/.env.production ~/ningbo/.env
    #  echo "Renamed .env.production to .env in ningbo directory."
    #fi

    # Load the Docker image
    docker load -i ningbo-app.tar

    # Create docker-compose.yml if it doesn't exist
    if [ ! -f docker-compose.yml ]; then
        cat > docker-compose.yml << 'EOL'

services:
  web:
    image: ningbo-app:latest
    container_name: ningbo
    environment:
      - NODE_ENV=production
    #env_file:
    #  - .env
    restart: unless-stopped
    networks:
      - nginx-network
    expose:
      - "3002"

networks:
  nginx-network:
    external: true

EOL
    fi

    # Stop any existing containers
    docker-compose down

    # Start the new container
    docker-compose up -d

    # Clean up Commented out for now
    rm ningbo-app.tar
ENDSSH

# Clean up local files
echo "Cleaning up..."
rm ningbo-app.tar

echo "Deployment complete!" 