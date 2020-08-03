FROM ubuntu:18.04

ENV DEBIAN_FRONTEND noninteractive

ARG NODE_VERSION=10.15.3
ENV NODE_VERSION $NODE_VERSION
ENV YARN_VERSION 1.13.0

# Optionally build a striped Theia application with no map file or .ts sources.
# Makes image ~150MB smaller when enabled
ARG strip=false
ENV strip=$strip

#Common deps
RUN apt-get update && \
    apt-get -y install build-essential \
                       curl \
                       git \
                       gpg \
                       python \
                       wget \
                       xz-utils


#Developer tools

## Git and sudo (sudo needed for user override)
RUN apt-get update && apt-get -y install git sudo


RUN apk add libx11-dev libxkbfile-dev
# Dependencies of KEITH build
RUN apk add --no-cache make gcc g++ python
# Dependencies to untar and download LS
RUN apk add --no-cache curl tar sed unzip
# Java
RUN apt-get update && apt-get -y install openjdk-11-jdk maven gradle

RUN chmod g+rw /home && \
    mkdir -p /home/project && \
    mkdir -p /usr/local/kieler && \
    mkdir -p /home/theia/.pub-cache/bin && \
    chown -R theia:theia /home/theia && \
    chown -R theia:theia /home/project && \
    chown -R theia:theia /usr/local/kieler

# Theia application
##Needed for node-gyp, nsfw build
RUN apt-get update && apt-get install -y python build-essential && \
  apt-get clean && \
  apt-get autoremove -y && \
  rm -rf /var/cache/apt/* && \
  rm -rf /var/lib/apt/lists/* && \
  rm -rf /tmp/*

ENV PATH=/usr/local/kieler:$PATH

USER theia
WORKDIR /home/theia

ADD . keith
RUN cd keith && yarn
# download, unpack and modify LS
RUN curl -k -L https://rtsys.informatik.uni-kiel.de/~kieler/files/nightly/sccharts-integration/language-server-lin.zip  > kieler.zip
RUN unzip kieler.zip -d /usr/local/kieler
RUN rm kieler.zip 
EXPOSE 3000
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENTRYPOINT [ "node", "/home/theia/src-gen/backend/main.js", "/home/project", "--hostname=0.0.0.0" ]