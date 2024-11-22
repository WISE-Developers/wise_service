# WISE Requires Ubuntu Focal 20.04 while Builder does not.
FROM ubuntu:focal

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# setup timezone - the timezone where this modeler sits
ENV TZ=America/Edmonton
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Gather Args (Passed ENV vars from the host)
ARG WISE_ENGINE_VERSION="1.0.6-beta.5"
ARG WISE_INTERNAL_JOBS_FOLDER="/usr/src/app/WISE_data/jobs"
ARG WISE_JS_API_LINK="https://github.com/WISE-Developers/WISE_JS_API/releases/download/1.0.6-beta.5/WISE_JS_API-1.0.6-beta.5.zip"


#Install Java and other software into the container
RUN apt-get update -qq && apt-get install -qq --no-install-recommends \
	htop \
	build-essential \ 
	zip \
	unzip \
	software-properties-common \ 
	dirmngr \ 
	curl \
	apt-transport-https \
	nano \ 
	iputils-ping \
	&& rm -rf /var/lib/apt/lists/*

# Install NPM and NODEJS
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install -y nodejs 

# work around bug in openssl (remove the last line in config)
# allows FETCH to use SSL otherwise secure connections fail
RUN head -n -1 /etc/ssl/openssl.cnf > temp.txt ; mv temp.txt /etc/ssl/openssl.cnf
RUN mkdir -p /usr/src/app/node_modules/wise_js_api

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

WORKDIR /usr/src/app
COPY ./dist/fireModels ./dist/fireModels
COPY ./dist/gui ./dist/gui
COPY ./public ./public
COPY ./src/views ./dist/views
COPY configVars.sh .
#COPY . .

# RUN pwd
# RUN echo "SHowing the jobs/ image..."
# RUN cat ${WISE_INTERNAL_JOBS_FOLDER}/config.json

# Install NodeJS Dependancies

COPY package*.json /usr/src/app/
RUN npm install
WORKDIR /usr/src/app/node_modules/wise_js_api
RUN npm install
WORKDIR /usr/src/app
RUN chmod a+x /usr/src/app/configVars.sh
RUN . ./configVars.sh

# Launch builder to run in the background.
CMD ["npm", "run", "GUI"]