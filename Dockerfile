# Minimal image for the MOJAVE RUN multiplayer relay.
# Works on Render, Fly.io, Railway, or any plain container host.
FROM node:20-alpine

WORKDIR /app

# Install deps first so the layer cache survives source edits.
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy the rest (server + the static client so the same container can serve both).
COPY . .

ENV NODE_ENV=production
# Hosts inject PORT; default keeps `docker run` simple.
ENV PORT=8787
EXPOSE 8787

CMD ["node", "server.js"]
