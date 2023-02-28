#!/bin/sh
set -x
mkdir ~/.helios/
cp helios.toml ~/.helios/
exec helios
