#!/bin/sh
set -e
exce mkdir ~/.hermes/
exec cp config.toml ~/.hermes/
exec RUST_BACKTRACE=1 RUST_LOG=trace ./hermes forcerelay --ethereum-chain-id ibc-eth-0 --ckb-chain-id ibc-ckb-0
