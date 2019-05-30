FROM ghost:2.22-alpine

COPY package*.json ./

ADD content ./

RUN npm install
