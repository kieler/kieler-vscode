FROM node:10.15.3-alpine
LABEL maintainer="Kiel University"

LABEL name="keith"
LABEL version="0.1"
# Regarding some issue
RUN apk add libx11-dev libxkbfile-dev
# Dependencies of KEITH build
RUN apk add --no-cache make gcc g++ python
# Dependencies to untar and download LS
RUN apk add --no-cache curl tar sed unzip

WORKDIR /home/theia
# build keith
ADD . keith
# COPY post-install.dummy.log keith/node_modules/electron/post-install.log
# RUN cd keith && yarn; exit 0
# RUN ls -l keith/node_modules/electron
# COPY post-install.dummy.log keith/node_modules/electron/post-install.log
RUN cd keith && yarn
# download, unpack and modify LS
RUN curl -k -L https://rtsys.informatik.uni-kiel.de/~kieler/files/release_sccharts_1.2.0/ls/kieler-language-server.linux.jar
#RUN unzip kieler.zip -d .
COPY kieler-language-server.linux.jar language-server/kieler-language-server.linux.jar
# RUN sed -i '1s/^/-application\nde.cau.cs.kieler.language.server.LanguageServer\n-noSplash\n/' ./kieler/kieler.ini
# RUN echo "DID the stuff"

FROM node:10.15.3-alpine
# See : https://github.com/theia-ide/theia-apps/issues/34
RUN addgroup theia && \
    adduser -G theia -s /bin/sh -D theia;
RUN chmod g+rw /home && \
    mkdir /home/theia/language-server && \
    mkdir -p /home/project && \
    chown -R theia:theia /home/theia && \
    chown -R theia:theia /home/project && \
    chown -R theia:theia /home/theia/language-server
RUN apk add --no-cache git openssh bash
# Add java to run LS
RUN apk add openjdk11-jdk maven gradle
ENV HOME /home/theia
WORKDIR /home/theia
# copy keith build on first container to current container
COPY --from=0 --chown=theia:theia /home/theia/keith /home/theia
COPY --from=0 --chown=theia:theia /home/theia/language-server /home/theia/language-server
RUN chown -R theia:theia /home/theia/language-server
RUN chmod 777 /home/theia/language-server/kieler-language-server.linux.jar
ENV PATH=/home/theia/language-server:$PATH
RUN java -jar -Dport=5007 language-server/kieler-language-server.linux.jar
EXPOSE 3000
USER theia
ENTRYPOINT [ "node", "/home/theia/keith-app/src-gen/backend/main.js", "/home/project", "--hostname=0.0.0.0"]
# Maybe I have to specify the location of the language server (somehow)

# build via
# docker build . -t keith -f ./Dockerfile

# called via 
# docker run -it -p 3000:3000 -v "$(pwd):/home/project:cached" keith:lastest --LS_PATH=/home/kieler/kieler
# remove latest on first build
# Try ../kieler/kieler next
# Access http://localhost:3000/#/home/theia/workspace