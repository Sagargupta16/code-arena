FROM node:20-slim
WORKDIR /app
RUN npm init -y && npm install alfa-leetcode-api
WORKDIR /app/node_modules/alfa-leetcode-api
RUN npm install --ignore-scripts && npm install typescript@5.4
RUN npx tsc
EXPOSE 3000
CMD ["node", "dist/index.js"]
