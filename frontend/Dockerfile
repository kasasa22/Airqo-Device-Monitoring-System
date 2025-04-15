# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install TypeScript and required types
RUN npm install --save-dev typescript @types/react @types/node

# Copy the rest of the application code
COPY . .

# Expose the development port
EXPOSE 3000

# Start the dev server
CMD ["npm", "run", "dev"]
