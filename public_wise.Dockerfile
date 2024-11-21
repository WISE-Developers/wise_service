# WISE Requires Ubuntu Focal while Builder does not.
FROM ubuntu:focal

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# setup timezone - the timezone where this modeler sits
ENV TZ=America/Yellowknife
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Gather Args (Passed ENV vars from the host)

ARG WISE_ENGINE_VERSION="1.0.6-beta.5"
ARG WISE_DISTRIBUTION_LINK="https://github.com/WISE-Developers/WISE_Application/releases/download/1.0.6-beta.5/wise-ubuntu2004-1.0.6-beta.5.deb"
ARG WISE_INTERNAL_JOBS_FOLDER="/usr/src/app/WISE_data/jobs"


#Install Java and other software into the container
RUN apt-get update -qq && apt-get install -qq --no-install-recommends \
	openjdk-16-jre \
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
	libxerces-c3.2 \
    libgdal26 \
    proj-bin \
    libnuma1 \
	&& rm -rf /var/lib/apt/lists/*

# Install NPM and NODEJS
# RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
# RUN apt install -y nodejs 

# Install WISE
# 1. Download and decompress the wise builder zip.
# 2. Copy the WISE_Builder.jar and WISE_Builder_lib to /usr/bin
# 3. Download and install the WISE engine debian package.
# 4. Clean up temporary files.

RUN mkdir -p /tmp/WISE/

RUN curl -fsSL ${WISE_DISTRIBUTION_LINK} -o /tmp/WISE/WISE_${WISE_ENGINE_VERSION}.deb; 
RUN ls -lha /tmp/WISE;

# Install the WISE binaries.

RUN apt install -y /tmp/WISE/WISE_${WISE_ENGINE_VERSION}.deb 
RUN rm -rf /tmp/WISE;

# work around bug in openssl (remove the last line in config)
# allows FETCH to use SSL otherwise secure connections fail
RUN head -n -1 /etc/ssl/openssl.cnf > temp.txt ; mv temp.txt /etc/ssl/openssl.cnf

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)

CMD ["tail", "-f", "/dev/null"]