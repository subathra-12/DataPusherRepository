FROM node:20-alpine

# Install dependencies needed for ts-node
WORKDIR /usr/src/app

# Install bash and git (optional but sometimes needed)
RUN apk add --no-cache bash git

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for ts-node)
RUN npm install

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Start the TypeScript app
CMD ["npm", "start"]
