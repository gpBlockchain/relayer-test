#!/bin/sh
set -x
mkdir ~/.helios/
cp config.toml ~/.helios/
exec helios
