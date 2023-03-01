#!/bin/sh
set -x
mkdir ~/.hermes/
cp config.toml ~/.hermes/
hermes keys add --key-file relayer-seed.json --chain ibc-ckb-0
export RUST_BACKTRACE=1 RUST_LOG=trace
exec hermes forcerelay --ethereum-chain-id ibc-eth-0 --ckb-chain-id ibc-ckb-0
