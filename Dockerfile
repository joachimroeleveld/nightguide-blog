FROM ghost:2.22-alpine

COPY package*.json ./

ADD content ./content

RUN npm install
