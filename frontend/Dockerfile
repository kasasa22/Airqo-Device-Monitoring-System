# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Install Next.js globally to ensure it's in the path
RUN npm install -g next

# Expose the development port
EXPOSE 3000

# Start the dev server
CMD ["npm", "run", "dev"]