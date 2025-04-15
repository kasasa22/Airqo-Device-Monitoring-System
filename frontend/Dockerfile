# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Install pnpm globally - this is what Next.js is trying to use
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./

# Install dependencies with npm (keeping your original approach)
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Expose the development port
EXPOSE 3000

# Start the dev server
CMD ["npm", "run", "dev"]