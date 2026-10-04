FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force

COPY . .

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "server.js"]