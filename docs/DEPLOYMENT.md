# docs/DEPLOYMENT.md — Clear Air Companion Deployment Guide
> Version: 2.0.0 | Stage: V2-28 | Authority: DEP-001 to DEP-004

This document defines the deployment architecture, container configuration, environment specifications, cloud deployment blueprints (Google Cloud Run & Render), verification steps, and zero-downtime release/rollback protocols.

---

## 1. Deployment Architecture

Clear Air Companion is packaged as an Alpine Docker container running Next.js 14 standalone output on Node 20.

```
                    ┌────────────────────────────┐
                    │      Cloud Load Balancer   │
                    │   (TLS Termination, CDN)   │
                    └──────────────┬─────────────┘
                                   │ HTTPS :443
                                   ▼
                    ┌────────────────────────────┐
                    │     Docker Container       │
                    │   User: nextjs (UID 1001)  │
                    │   Port: 3000 (HTTP)        │
                    │   Healthcheck: /api/health │
                    └──────────────┬─────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   Open-Meteo Air Quality & Geocoding             Gemini 1.5 Flash API
   (Free public REST API, keyless)            (Optional, server-only key)
```

### Key Architectural Invariants
1. **Unprivileged Execution**: Runs as non-root user `nextjs` (UID 1001, GID 1001).
2. **Standalone Output**: Only bundled runtime assets in `.next/standalone` and static chunks in `.next/static` are packaged. Total image size is ~180 MB.
3. **Zero Secrets in Image**: Build does not accept or bake secret arguments or environment files.
4. **Deterministic Boot**: If `GEMINI_API_KEY` is omitted, the service boots cleanly in deterministic Basic Mode.

---

## 2. Environment Variables Reference (NFR-003, DEP-003)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | No | `production` | Node.js runtime environment |
| `PORT` | No | `3000` | Port for the standalone server |
| `APP_ORIGIN` | No | `http://localhost:3000` | Base URL for CORS and absolute URL formation |
| `LOG_LEVEL` | No | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |
| `AQ_PROVIDER` | No | `open-meteo` | Upstream air quality provider adapter |
| `RATE_LIMIT_PLAN` | No | `6` | Plan generation requests per minute per IP (`RATE_LIMITS.planPerMinute`) |
| `RATE_LIMIT_AQI` | No | `30` | Air quality requests per minute per IP (`RATE_LIMITS.airQualityPerMinute`) |
| `RATE_LIMIT_GEOCODE` | No | `30` | Geocoding requests per minute per IP (`RATE_LIMITS.geocodePerMinute`) |
| `TRUSTED_PROXY_HEADER` | No | `x-forwarded-for` | Header used for rate limit IP derivation |
| `CLIENT_IP_SALT` | No | Auto-generated UUID | Salt for SHA-256 IP hashing (never store raw IP) |
| `GEMINI_API_KEY` | Optional | `undefined` | Google Gemini API key for AI narration & photo audit. If absent, fallback rules engine is used |
| `GEMINI_MODEL` | No | `gemini-3.8-flash` | Gemini model identifier for text & image input |
| `LLM_ENABLED` | No | `true` | Master toggle for LLM narration |
| `LLM_DAILY_CALL_CAP`| No | `1000` | Daily budget circuit breaker for LLM invocations |

---

## 3. Local Container Build & Run (DEP-001)

### Building the Image
```bash
docker build -t clear-air-companion:v2.0.0 .
```

### Running with Zero Keys (Basic Mode)
```bash
docker run -d \
  --name clear-air-companion \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  clear-air-companion:v2.0.0
```

### Running with Gemini Key (Vision & Copilot AI Enabled)
```bash
docker run -d \
  --name clear-air-companion \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e GEMINI_API_KEY="AIzaSy..." \
  -e LOG_LEVEL=info \
  clear-air-companion:v2.0.0
```

---

## 4. Cloud Deployment Blueprints

### 4.1 Google Cloud Run Deployment
```bash
# 1. Build and push image to Google Artifact Registry
gcloud builds submit --tag gcr.io/$PROJECT_ID/clear-air-companion:latest

# 2. Deploy to Cloud Run with unauthenticated access and autoscaling
gcloud run deploy clear-air-companion \
  --image gcr.io/$PROJECT_ID/clear-air-companion:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,LOG_LEVEL=info" \
  --set-secrets "GEMINI_API_KEY=vayusaathi-gemini-key:latest"
```

### 4.2 Render Container Service
1. Connect GitHub repository in Render Dashboard.
2. Select **Web Service** with **Docker** runtime.
3. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `GEMINI_API_KEY`: *(Secure Secret)*
4. Set Health Check Path: `/api/health`.

---

## 5. Verification & Smoke Testing (REL-003, DEP-001)

Once the container or standalone server is running on port 3000:

```bash
node scripts/smoke.mjs
```

Expected output:
```
======================================================
  VayuSaathi Smoke Verification: http://localhost:3000
======================================================

  • GET / (Root HTML & Security Headers)... ✓ PASS
  • GET /api/health (Liveness probe)... ✓ PASS
  • GET /api/ready (Readiness probe)... ✓ PASS
  • GET /api/geocode?q=Delhi... ✓ PASS
  • POST /api/plan (Deterministic plan generation)... ✓ PASS
  • POST /api/bulletin (Bilingual WhatsApp RWA advisory)... ✓ PASS
  • POST /api/audit (Photo IAQ Audit in Basic Mode)... ✓ PASS
  • POST /api/ask (Follow-up Q&A with Guardrails)... ✓ PASS

======================================================
  ALL SMOKE CHECKS PASSED (100% OPERATIONAL)
======================================================
```
