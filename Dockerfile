FROM node:20-alpine
WORKDIR /app

# Install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy server files
COPY http-server.cjs ./

ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

CMD ["node", "http-server.cjs"]
