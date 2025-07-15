# Back-end/mainServer/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create upload directory
RUN mkdir -p upload/avatars

EXPOSE 5000

CMD ["node", "server.js"]