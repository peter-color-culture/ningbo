# Use official Node.js image as the base
FROM node:22-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy pnpm files and package.json
COPY package.json pnpm-lock.yaml tsconfig.json next.config.ts ./
#COPY .env ./

# Install dependencies
RUN pnpm install

# Copy source files
COPY app ./app
COPY public ./public
#COPY tailwind.config.js ./
COPY postcss.config.mjs ./

# Set production environment
ENV NODE_ENV=production

# Debug info
RUN ls -l /app
RUN node -v
RUN cat next.config.ts
RUN npx next --version

# Build the app
RUN pnpm build

# Expose port (default for Next.js)
EXPOSE 3002

# Start the Next.js app
CMD ["pnpm", "start"]