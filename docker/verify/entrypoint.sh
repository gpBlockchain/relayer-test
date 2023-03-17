#!/bin/sh
set -x
mkdir ~/.forceth/
cp config.toml ~/.forceth/
exec forceth
