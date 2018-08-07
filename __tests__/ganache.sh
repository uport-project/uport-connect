#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

testrpc_port=8545


testrpc_running() {
  nc -z localhost "$testrpc_port"
}

start_testrpc() {
    node_modules/.bin/ganache-cli -i 15 --gasLimit 50000000 --port "$testrpc_port" > /dev/null &
    testrpc_pid=$!
}

if testrpc_running; then
  echo "Killing testrpc instance at port $testrpc_port"
  kill -9 $(lsof -i:$testrpc_port -t)
fi

echo "Starting our own testrpc instance at port $testrpc_port"
start_testrpc
sleep 5

# Exit error mode so the testrpc instance always gets killed
set +e
result=0

jest "$@"
result=$?

kill -9 $testrpc_pid

exit $result
