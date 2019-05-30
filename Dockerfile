FROM ghost:2.22-alpine

COPY package*.json ./

# TODO: bake content folders into image

RUN npm install
