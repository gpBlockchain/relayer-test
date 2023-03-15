#!/bin/sh
set -x
mkdir ~/.forcerelay/
cp config.toml ~/.forcerelay/
exec forcerelay
