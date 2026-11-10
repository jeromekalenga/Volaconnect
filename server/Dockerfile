FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
COPY schema.sql ./schema.sql
USER node
EXPOSE 10000
CMD ["node", "src/server.js"]
