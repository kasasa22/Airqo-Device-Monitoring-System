# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the development port
EXPOSE 3000

# Start the dev server
CMD ["npm", "run", "dev"]
