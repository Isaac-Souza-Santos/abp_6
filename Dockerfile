# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Expose port (if needed for future web interface)
EXPOSE 3000

# Run the bot
CMD ["npm", "start"]