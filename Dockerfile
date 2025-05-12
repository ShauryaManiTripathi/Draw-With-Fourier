# Use multi-stage build for a smaller final image

# Build stage for Go application
FROM golang:1.20-bullseye as go-builder
WORKDIR /build
COPY . .
RUN go mod tidy && \
    go get -v github.com/codegangsta/gin && \
    go build -o app .

# Final stage with minimal dependencies
FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install essential packages with cleanup in the same layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    mysql-server \
    gnupg && \
    # Install Node.js and npm
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    # Configure MySQL
    mkdir -p /var/run/mysqld && \
    chown -R mysql:mysql /var/run/mysqld && \
    echo "[mysqld]" >> /etc/mysql/my.cnf && \
    echo "bind-address = 0.0.0.0" >> /etc/mysql/my.cnf && \
    echo "port = 3306" >> /etc/mysql/my.cnf && \
    # Clean up
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create project directory
WORKDIR /app

# Copy only necessary files
COPY --from=go-builder /build/app .
COPY . .
# Expose ports for MySQL and web servers
# Port 3000 is the main frontend port that should be mapped when running the container
EXPOSE 3306 8081 3000

# Create startup script
RUN echo '#!/bin/bash\n\
service mysql start\n\
echo "MySQL started, initializing..."\n\
\n\
# Wait for MySQL to be ready\n\
max_tries=30\n\
tries=0\n\
while ! mysql -uroot -e "SELECT 1" >/dev/null 2>&1; do\n\
    echo "Waiting for MySQL to be ready..."\n\
    sleep 1\n\
    tries=$((tries+1))\n\
    if [ $tries -ge $max_tries ]; then\n\
        echo "MySQL failed to start in time"\n\
        exit 1\n\
    fi\n\
done\n\
\n\
# Set up MySQL root password\n\
mysql -e "ALTER USER '\''root'\''@'\''localhost'\'' IDENTIFIED WITH mysql_native_password BY '\''passwd'\'';" || true\n\
mysql -e "CREATE USER IF NOT EXISTS '\''root'\''@'\''%'\'' IDENTIFIED WITH mysql_native_password BY '\''passwd'\'';" || true\n\
echo "MySQL initialized with root password"\n\
\n\
# Start Go backend\n\
cd /app\n\
echo "Starting Go backend..."\n\
./apid &\n\
GO_PID=$!\n\
echo "Go backend started with PID $GO_PID"\n\
\n\
# Start frontend on port 3000 - make sure to map this port when running the container\n\
cd /app/frontend\n\
echo "Starting frontend server on port 3000..."\n\
npx serve -l 3000 &\n\
SERVE_PID=$!\n\
echo "Frontend server started with PID $SERVE_PID"\n\
echo "Access the frontend at http://localhost:3000 (when port is mapped)"\n\
\n\
# Keep container running\n\
echo "All services started. Press Ctrl+C to stop."\n\
wait $GO_PID $SERVE_PID\n\
' > /app/start.sh && \
chmod +x /app/start.sh

# Start services
CMD ["/app/start.sh"]
