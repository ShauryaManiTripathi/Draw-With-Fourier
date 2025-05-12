#!/bin/bash
# Script to update the Docker image for fourier-artist

# Navigate to the project directory (adjust if needed)
cd /home/fullname/Desktop/funProjects/go-figure-api

# Build the new Docker image
echo "Building new Docker image..."
docker build -t shauryat1/fourier-artist:latest .

# Optionally, tag with a version number
echo "Tagging with version..."
VERSION="1.2.0"  # Update this version number as appropriate
docker tag shauryat1/fourier-artist:latest shauryat1/fourier-artist:$VERSION

# Push the new images to Docker Hub
echo "Pushing to Docker Hub..."
docker push shauryat1/fourier-artist:latest
docker push shauryat1/fourier-artist:$VERSION

echo "Docker image update complete!"
