FROM node:8-alpine
LABEL maintainer="Kiel University"

LABEL name="keith"
LABEL version="0.1"

RUN apk add --no-cache make gcc g++ python git
WORKDIR /home/theia
ADD package.json ./package.json
ADD . keith
RUN cd keith && yarn

FROM node:8-alpine
# See : https://github.com/theia-ide/theia-apps/issues/34
RUN addgroup theia && \
    adduser -G theia -s /bin/sh -D theia;
RUN chmod g+rw /home && \
    chown -R theia:theia /home/theia
RUN apk add --no-cache git openssh bash
ENV HOME /home/theia
WORKDIR /home/theia
COPY --from=0 --chown=theia:theia /home/theia/keith /home/theia
EXPOSE 3000
USER theia
ENTRYPOINT [ "node", "/home/theia/keith-app/src-gen/backend/main.js", "--hostname=0.0.0.0" ]


# build via
# docker build . -t keith -f ./Dockerfile

# called via 
# docker run -it -p 3000:3000 -v "$(pwd):/home/project:cached" keith:lastest
# remove latest on first build