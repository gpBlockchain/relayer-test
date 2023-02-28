FROM nervos/ckb-docker-builder:bionic-rust-1.67.1 as synapseweb3-relayer-docker-builder

WORKDIR /

RUN git clone https://github.com/synapseweb3/relayer.git

RUN cd relayer \
    && git checkout main \
    && cargo build --release

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    curl

FROM ubuntu:bionic

COPY --from=synapseweb3-relayer-docker-builder \
     /usr/lib/x86_64-linux-gnu/libssl.so.* \
     /usr/lib/x86_64-linux-gnu/libcrypto.so.* \
     /usr/lib/x86_64-linux-gnu/

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    curl

COPY --from=synapseweb3-relayer-docker-builder \
     /relayer/target/release/hermes \
     /usr/local/bin/

WORKDIR /home

COPY ./config.toml ./entrypoint.sh /home/

ENTRYPOINT ["/home/entrypoint.sh"]
