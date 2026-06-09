#!/usr/bin/env bash
set -euo pipefail

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

RPC_URL="${MANTLE_SEPOLIA_RPC_URL:-https://rpc.sepolia.mantle.xyz}"
PRIVATE_KEY="${MANTLE_PRIVATE_KEY:-${PRIVATE_KEY:-}}"
EXPECTED_CHAIN_ID="5003"

if [[ -z "$PRIVATE_KEY" ]]; then
  echo "Missing MANTLE_PRIVATE_KEY or PRIVATE_KEY env var." >&2
  exit 1
fi

ACTUAL_CHAIN_ID="$(cast chain-id --rpc-url "$RPC_URL")"
if [[ "$ACTUAL_CHAIN_ID" != "$EXPECTED_CHAIN_ID" ]]; then
  echo "Refusing to deploy: RPC chain id is $ACTUAL_CHAIN_ID, expected $EXPECTED_CHAIN_ID." >&2
  exit 1
fi

forge create \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  contracts/FlightRecorder.sol:FlightRecorder
