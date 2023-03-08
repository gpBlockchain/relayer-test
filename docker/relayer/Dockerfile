FROM nervos/ckb-docker-builder:bionic-rust-1.67.1 as synapseweb3-relayer-docker-builder

WORKDIR /

RUN git clone https://github.com/synapseweb3/forcerelay.git

RUN cd forcerelay \
    && git checkout main \
    && cargo build

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates

FROM ubuntu:bionic

COPY --from=synapseweb3-relayer-docker-builder \
     /usr/lib/x86_64-linux-gnu/libssl.so.* \
     /usr/lib/x86_64-linux-gnu/libcrypto.so.* \
     /usr/lib/x86_64-linux-gnu/

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates

COPY --from=synapseweb3-relayer-docker-builder \
     /forcerelay/target/debug/hermes \
     /usr/local/bin/

WORKDIR /home

COPY ./config.toml ./relayer-seed.json ./entrypoint.sh /home/

ENTRYPOINT ["/home/entrypoint.sh"]
