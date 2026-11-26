#!/usr/bin/env bash
# =============================================================================
# scripts/smoke.sh — Clear Air Companion Production Smoke Test
# Tests: health, ready, security headers, and basic-mode plans for 3 AQI levels.
# Satisfies: DEP-001, REL-003, SEC-002, NFR-003
# =============================================================================
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
FAILED=0

echo "====================================================================="
echo "Running Production Smoke Tests against: ${BASE_URL}"
echo "====================================================================="

test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"
  local pattern="$4"

  echo -n "[TEST] ${name}... "
  local response
  response=$(curl -s -w "\n%{http_code}" "${url}" || echo "FAILED\n000")
  local http_code
  http_code=$(echo "${response}" | tail -n1)
  local body
  body=$(echo "${response}" | head -n -1)

  if [ "${http_code}" -eq "${expected_status}" ] && echo "${body}" | grep -q "${pattern}"; then
    echo "PASS (HTTP ${http_code})"
  else
    echo "FAIL (Expected HTTP ${expected_status} matching '${pattern}', got HTTP ${http_code})"
    echo "Body: ${body}"
    FAILED=1
  fi
}

# 1. Health endpoint
test_endpoint "Health Check (/api/health)" "${BASE_URL}/api/health" 200 '"status":"ok"'

# 2. Readiness endpoint
test_endpoint "Readiness Check (/api/ready)" "${BASE_URL}/api/ready" 200 '"status":"ready"'

# 3. Security headers check on /api/health
echo -n "[TEST] Security Headers Check... "
HEADERS=$(curl -s -I "${BASE_URL}/api/health")
MISSING_HEADERS=""
for header in "X-Frame-Options: DENY" "X-Content-Type-Options: nosniff" "Content-Security-Policy"; do
  if ! echo "${HEADERS}" | grep -qi "${header}"; then
    MISSING_HEADERS="${MISSING_HEADERS} '${header}'"
  fi
done

if [ -z "${MISSING_HEADERS}" ]; then
  echo "PASS (All security headers verified)"
else
  echo "FAIL (Missing headers:${MISSING_HEADERS})"
  FAILED=1
fi

# 4. Basic-mode plan for 3 AQI overrides (50, 150, 350)
test_plan() {
  local aqi="$1"
  local expected_band="$2"

  echo -n "[TEST] Basic-mode Plan (AQI=${aqi}, expected band=${expected_band})... "

  local payload
  payload=$(cat <<EOF
{
  "profile": {
    "schemaVersion": 1,
    "members": [
      { "ageBand": "adult", "vulnerabilityFlags": [] }
    ],
    "housingType": "well_sealed",
    "hasPurifier": false,
    "cookingFuel": "electric",
    "heatingType": "electric",
    "commuteTypes": ["work_from_home"],
    "budgetBand": "none"
  },
  "aqi": ${aqi},
  "pm25": $(( aqi * 6 / 10 )),
  "mode": "basic"
}
EOF
)

  local response
  response=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "${payload}" \
    "${BASE_URL}/api/plan" || echo "FAILED\n000")

  local http_code
  http_code=$(echo "${response}" | tail -n1)
  local body
  body=$(echo "${response}" | head -n -1)

  if [ "${http_code}" -eq 200 ] && echo "${body}" | grep -qi "${expected_band}"; then
    echo "PASS (HTTP 200, contains '${expected_band}')"
  else
    echo "FAIL (Expected HTTP 200 containing '${expected_band}', got HTTP ${http_code})"
    echo "Body: ${body}"
    FAILED=1
  fi
}

test_plan 50 "good"
test_plan 150 "usg"
test_plan 350 "hazardous"

echo "====================================================================="
if [ "${FAILED}" -eq 0 ]; then
  echo "ALL SMOKE TESTS PASSED SUCCESSFULLY"
  exit 0
else
  echo "SMOKE TESTS FAILED"
  exit 1
fi
