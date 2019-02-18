FROM node:8-alpine
LABEL maintainer="Kiel University"

LABEL name="keith"
LABEL version="0.1"
# Dependencies of KEITH build
RUN apk add --no-cache make gcc g++ python
# Dependencies to untar and download LS
RUN apk add --no-cache curl tar sed
WORKDIR /home/theia
# build keith
ADD . keith
RUN cd keith && yarn
# download, unpack and modify LS
RUN curl -k -L https://rtsys.informatik.uni-kiel.de/bamboo/browse/KISEMA-NSI-241/artifact/shared/Language-Server-Zip/sccharts_rca_nightly_201902140943-linux.gtk.x86_64.tar.gz > kieler.tar.gz
RUN tar -xzf kieler.tar.gz 
RUN rm kieler.tar.gz
RUN sed -i '1s/^/-application\nde.cau.cs.kieler.language.server.LanguageServer\n-noSplash\n/' ./kieler/kieler.ini    

FROM node:8-alpine
# See : https://github.com/theia-ide/theia-apps/issues/34
RUN addgroup theia && \
    adduser -G theia -s /bin/sh -D theia;
RUN chmod g+rw /home && \
    mkdir /home/kieler && \
    chown -R theia:theia /home/theia && \
    chown -R theia:theia /home/kieler
RUN apk add --no-cache git openssh bash
ENV HOME /home/theia
WORKDIR /home/theia
# copy keith build on first container to current container
COPY --from=0 --chown=theia:theia /home/theia/keith /home/theia
COPY --from=0 --chown=theia:theia /home/theia/kieler /home/kieler
EXPOSE 3000
USER theia
ENTRYPOINT [ "node", "/home/theia/keith-app/src-gen/backend/main.js", "--hostname=0.0.0.0" ]


# build via
# docker build . -t keith -f ./Dockerfile

# called via 
# docker run -it -p 3000:3000 -v "$(pwd):/home/project:cached" keith:lastest
# remove latest on first build