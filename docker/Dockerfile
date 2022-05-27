FROM nikolaik/python-nodejs:python3.10-nodejs14
MAINTAINER Caro s364362@sinyi.com.tw

ARG APP_ENV
ARG APP_PORT
ARG APP_NAME
ARG FTP_PORT

RUN echo "APP_ENV=${APP_ENV}, APP_PORT=${APP_PORT}, APP_NAME=${APP_NAME}, FTP_PORT=${FTP_PORT}"

# Set environment variable for CMD to use
ENV APP_ENV ${APP_ENV}

RUN apt-get update && apt-get install -y --no-install-recommends apt-utils

# Install vim
RUN apt-get install -y vim

# Install npm
RUN npm i npm@latest -g

# Install pm2
RUN npm install pm2 -g

# Install pm2 logrotate module
RUN pm2 install pm2-logrotate-ext

# Set pm2 logrotate timezone
RUN pm2 set pm2-logrotate-ext:TZ 'Asia/Taipei'

# Install gulp for frontend monitor
RUN npm install gulp -g

# Create app directory
RUN mkdir -p /var/app/${APP_NAME}

# Go to work path
WORKDIR /var/app/${APP_NAME}

# Install app dependencies
COPY package.json .
RUN npm install

# Bundle app source, excluding files in Dockerfile.dockerignore
COPY . .

EXPOSE ${APP_PORT} ${FTP_PORT}

CMD npm run start:${APP_ENV}
