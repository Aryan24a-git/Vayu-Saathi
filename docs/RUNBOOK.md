# docs/RUNBOOK.md — Clear Air Companion Production Runbook
> Version: 2.0.0 | Stage: V2-28 | Authority: DEP-004, OBS-001, OBS-002, REL-001 to REL-004

This runbook guides on-call engineers through service monitoring, alerting thresholds, incident triage, and rollback procedures.

---

## 1. System Overview & SLOs

- **Service Name**: `clear-air-companion`
- **Architecture**: Next.js 14 standalone container running on Node 20.
- **Port**: 3000
- **SLO Targets**:
  - Availability: 99.9% uptime on `/api/health` and `/api/plan`.
  - Latency: p95 response time < 300ms for deterministic plans (`/api/plan?mode=basic`).
  - Fallback Reliability: 100% successful Basic Mode plan generation even when upstream providers or LLM APIs fail.

---

## 2. Telemetry & Log Monitoring (OBS-001, OBS-002)

Logs are emitted in newline-delimited JSON with automatic redaction of coordinates (`lat`, `lon`), personal queries, and API keys.

### Key Telemetry Counters in Logs

| Log Field | Value | Meaning | Expected Action if Spike |
|---|---|---|---|
| `counter` | `providerFailure` | Upstream Open-Meteo failure | Check upstream status; confirm fallback active |
| `counter` | `breakerOpen` | Circuit breaker tripped (>5 errors in 30s) | Service sheds upstream load; self-heals after 30s |
| `counter` | `cacheHit` | AQI or geocoding in-memory cache hit | Normal; should be >70% under moderate traffic |
| `counter` | `fallbackRate` | LLM planning failed; rules engine served plan | Check Gemini API status or quota |

### Sample Log Ingestion Query (e.g. CloudWatch / Datadog / Grafana Loki)
```json
{level="warn"} |= "counter"
```

---

## 3. Alerts & Incident Response Triage

### Alert 1: Elevated Fallback Rate (`fallbackRate > 20%` over 5 min)
- **Severity**: P3 (Minor - User experience degrades gracefully to deterministic Basic Mode; domain rules remain 100% intact).
- **Causes**:
  1. `GEMINI_API_KEY` expired or exhausted daily quota (`LLM_DAILY_CALL_CAP`).
  2. Gemini API experiencing elevated latency or outages.
- **Triage**:
  1. Inspect container logs: `docker logs clear-air-companion | grep fallbackReason`.
  2. If quota exceeded, verify rate limits or increase daily call cap if appropriate.
  3. No emergency rollback required — application seamlessly serves deterministic plans.

### Alert 2: Upstream Air Quality Provider Outage (`providerFailure > 50` over 5 min)
- **Severity**: P2 (Moderate).
- **Symptoms**: Users unable to fetch automatic live AQI by geocoding.
- **Automatic Protection**: Circuit breaker trips (`breakerOpen`) to prevent upstream connection saturation.
- **User Experience**: Application alerts users to enter their city or manual AQI value, or select a Demo scenario. Basic-mode planning remains 100% available.

### Alert 3: Readiness Check Failing (`GET /api/ready` returning 503)
- **Severity**: P1 (Critical - Container will be removed by load balancer).
- **Causes**: Environment configuration validation failed (`getEnv()` threw on missing required vars).
- **Triage**:
  1. Review recent deployment environment changes.
  2. Check container logs for `Environment validation failed: ...`.
  3. Fix invalid environment variable or execute Rollback immediately.

---

## 4. Rollback Procedure (DEP-004)

If a release introduces a regression, roll back immediately to the previous verified image tag.

### Step 1: Identify Previous Known-Good Tag
Check release history:
```bash
docker images | grep clear-air-companion
```

### Step 2: Stop Regressed Container
```bash
docker stop clear-air-companion
docker rm clear-air-companion
```

### Step 3: Launch Previous Image
```bash
docker run -d \
  --name clear-air-companion \
  -p 3000:3000 \
  --restart unless-stopped \
  --env-file /etc/clear-air-companion/production.env \
  ghcr.io/<org>/clear-air-companion:v1.0.0
```

### Step 4: Verify Rolled Back Instance
Run the automated smoke test:
```bash
node scripts/smoke.mjs
```
Confirm all health, ready, security headers, and basic-mode plan checks show **PASS**.
