FROM node:18-alpine

WORKDIR /app

# Copy dependency files first (better caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose the API port
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]