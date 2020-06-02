FROM node:12

WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PATH="${PATH}:./node_modules/.bin"

COPY package*.json ./
RUN NODE_ENV=development npm i
COPY . .

CMD [ "node", "dist/examples/qmit/" ]
