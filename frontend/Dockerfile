# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Install pnpm globally (for TypeScript dependency installation)
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./

# Install dependencies with npm
RUN npm install --legacy-peer-deps

# Explicitly install next globally to ensure it's in PATH
RUN npm install -g next

# Copy the rest of the application code
COPY . .

# Expose the development port
EXPOSE 3000

# Start the dev server with full path to next
CMD ["npx", "next", "dev"]