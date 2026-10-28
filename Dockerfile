FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app
EXPOSE 3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

CMD ["node", "src/index.js"]
