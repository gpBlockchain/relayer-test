#!/bin/sh
mkdir ~/.hermes/
cp config.toml ~/.hermes/
export RUST_BACKTRACE=1 RUST_LOG=trace
exec hermes forcerelay --ethereum-chain-id ibc-eth-0 --ckb-chain-id ibc-ckb-0
