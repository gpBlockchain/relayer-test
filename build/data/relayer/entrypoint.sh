#!/bin/sh
set -x
mkdir ~/.hermes/
cp config.toml ~/.hermes/
forcerelay keys add --key-file relayer-seed.json --chain ibc-ckb-1
export RUST_BACKTRACE=1 RUST_LOG=trace
exec forcerelay eth-ckb --ethereum-chain-id ibc-eth-1 --ckb-chain-id ibc-ckb-1
