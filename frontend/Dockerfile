# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Set Next.js to use npm instead of pnpm
ENV NEXT_TELEMETRY_DISABLED=1
ENV npm_config_yes=true

# Copy package files
COPY package*.json ./

# Install all dependencies with --force to bypass peer dependency issues
RUN npm install --legacy-peer-deps --force

# Install TypeScript and types with force flag
RUN npm install --save-dev typescript @types/react @types/node --legacy-peer-deps --force

# Copy the rest of the application code
COPY . .

# Force Next.js to use npm for TypeScript installation
RUN mkdir -p .next && echo '{"packageManager":"npm"}' > .next/package.json

# Expose the development port
EXPOSE 3000

# Run Next.js with NPM explicitly
CMD ["npm", "run", "dev"]