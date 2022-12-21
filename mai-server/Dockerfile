FROM node:16-alpine3.11

RUN mkdir -p /app
WORKDIR /app
COPY package.json .
COPY tsconfig.json .
COPY .env .
COPY ./src ./src

RUN npm install
# RUN npm install -g typescript

RUN npm run build

ENV NODE_ENV="production"

EXPOSE 5001
CMD ["npm", "start"]