FROM node:13-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json ./

RUN yarn install

COPY . .
