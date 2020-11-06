FROM node:12

WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PATH="${PATH}:./node_modules/.bin"

COPY package.json yarn.lock ./
RUN NODE_ENV=development yarn
COPY . .
RUN yarn build

CMD [ "node", "dist/examples/qmit/" ]
