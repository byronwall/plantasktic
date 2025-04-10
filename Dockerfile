# Base image
FROM node:20

# Create app directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY prisma/schema.prisma ./prisma/

RUN pnpm install --frozen-lockfile

# Copy the rest of the app's source code
COPY . .

# build prisma types, build, clear cache
RUN npx prisma generate && pnpm run build && pnpm store prune

# Expose port
EXPOSE 3000

# Start the app
CMD ["pnpm", "run", "start-prod"]