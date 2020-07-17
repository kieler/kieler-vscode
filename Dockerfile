FROM node:8-alpine
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
RUN cd keith && yarn
# download, unpack and modify LS
RUN curl -k -L https://rtsys.informatik.uni-kiel.de/~kieler/files/nightly/sccharts-integration/language-server-lin.zip  > kieler.zip
RUN unzip kieler.zip -d .
RUN rm kieler.zip
# RUN sed -i '1s/^/-application\nde.cau.cs.kieler.language.server.LanguageServer\n-noSplash\n/' ./kieler/kieler.ini
RUN echo "DID the stuff"

FROM node:8-alpine
# See : https://github.com/theia-ide/theia-apps/issues/34
RUN addgroup theia && \
    adduser -G theia -s /bin/sh -D theia;
RUN chmod g+rw /home && \
    mkdir /home/theia/kieler && \
    chown -R theia:theia /home/theia && \
    chown -R theia:theia /home/theia/kieler
RUN apk add --no-cache git openssh bash
# Add java to run LS
RUN apk add openjdk8
ENV HOME /home/theia
WORKDIR /home/theia
# copy keith build on first container to current container
COPY --from=0 --chown=theia:theia /home/theia/keith /home/theia
COPY --from=0 --chown=theia:theia /home/theia/language-server /home/theia/kieler
RUN chmod a+x /home/theia/kieler/kieler
# ENV PATH="/home/kieler:${PATH}"
EXPOSE 3000
USER theia
ENTRYPOINT [ "node", "/home/theia/keith-app/src-gen/backend/main.js", "--hostname=0.0.0.0"]
# Maybe I have to specify the location of the language server (somehow)

# build via
# docker build . -t keith -f ./Dockerfile

# called via 
# docker run -it -p 3000:3000 -v "$(pwd):/home/project:cached" keith:lastest --LS_PATH=/home/kieler/kieler
# remove latest on first build
# Try ../kieler/kieler next
# Access http://localhost:3000/#/home/theia/workspace
