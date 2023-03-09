set -x
echo "执行的docker-compose.yml：$1"
docker-compose -f "$1" stop