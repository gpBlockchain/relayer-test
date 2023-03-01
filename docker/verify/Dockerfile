FROM nervos/ckb-docker-builder:bionic-rust-1.67.1 as synapseweb3-forcerelay-verifier-docker-builder

WORKDIR /

RUN git clone https://github.com/synapseweb3/forcerelay-verifier

RUN cd forcerelay-verifier \
    && git checkout forcerelay-sdk \
    && cargo build -p cli

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates

FROM ubuntu:bionic

COPY --from=synapseweb3-forcerelay-verifier-docker-builder \
     /usr/lib/x86_64-linux-gnu/libssl.so.* \
     /usr/lib/x86_64-linux-gnu/libcrypto.so.* \
     /usr/lib/x86_64-linux-gnu/

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates

COPY --from=synapseweb3-forcerelay-verifier-docker-builder \
     /forcerelay-verifier/target/debug/helios \
     /usr/local/bin/

WORKDIR /home

COPY ./helios.toml ./entrypoint.sh /home/

ENTRYPOINT ["/home/entrypoint.sh"]
