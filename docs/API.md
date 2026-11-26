# API Contract & Endpoint Reference
> Version: 2.0.0 | Stage: V2-28 | Authority: SEC-001, SEC-003, SEC-005, SEC-010

All `/api/*` responses enforce strict security headers (CSP, nosniff, DENY, permissions) and contain no CORS headers.

## Common Error Schema

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "requestId": "uuid",
  "timestamp": "iso8601"
}
```

Standard codes: `BAD_REQUEST`, `VALIDATION_ERROR`, `PAYLOAD_TOO_LARGE`, `RATE_LIMITED`, `INTERNAL_ERROR`, `PROVIDER_UNAVAILABLE`, `NOT_FOUND`.

---

## 1. System Probes

### GET /api/health
Liveness probe. Returns `{ status: "ok", timestamp, version }`. Rate limit: 30/min.

### GET /api/ready
Readiness probe. Returns `{ status: "ready", timestamp, llm }` where `llm` is `true` only when `LLM_ENABLED`, `GEMINI_API_KEY` is present, and the configured `GEMINI_MODEL` has not failed with a 404 model-not-found error. Rate limit: 30/min.

---

## 2. Air Quality & Geocoding

### GET /api/geocode?q={city}
Searches Open-Meteo geocoding database via `src/server/providers/geocoding.ts`. Query: 2..100 characters. Returns `GeocodingResult[]`. Rate limit: 30/min.

### GET /api/air-quality?lat={lat}&lon={lon}
Direct coordinates air quality query via `src/server/providers/openMeteoAirQuality.ts`. Coordinates rounded to 2 decimal places. Returns `AqiReading` or `503 PROVIDER_UNAVAILABLE`. Rate limit: 30/min.

### GET /api/city-scenario?q={city}
Returns hourly winter smog scenario (hourly PM2.5, hourly wind speed, NAQI). Always geocodes live and fetches live Open-Meteo observations with 15-min in-memory LRU caching (`isSynthetic: false`), returning `404 NOT_FOUND` or `502 PROVIDER_UNAVAILABLE` on failure (never silent synthetic demo data). Rate limit: 30/min.

---

## 3. Planning & Playbook

### POST /api/plan
Generates personalized low-emission daily routines, indoor air hacks, and alternatives.
- Body limit: 16 kB (`MAX_BODY_BYTES`).
- Rate limit: 6/min.
- `mode="basic"`: 100% deterministic rule-based catalog assembly.
- `mode="live"`: Grounded LLM narrative rephrasing with deterministic fallback.

### POST /api/plan/narrate
Rephrases candidate actions into an empathetic, grounded narrative. Candidate actions must exist in catalog. Rate limit: 6/min.

### POST /api/playbook
Synthesizes dynamic playbook items (indoor hacks, emission swaps, pledges) for a location and profile. Rate limit: 15/min.

---

## 4. Multimodal IAQ Audit & Community

### POST /api/audit
Multimodal room/window/mask inspection.
- Body limit: 256 kB (`MAX_AUDIT_BODY_BYTES`) to accommodate compressed Base64 photo.
- Validates JPEG, PNG, or WebP magic bytes.
- When `GEMINI_API_KEY` is present: Uses configured `GEMINI_MODEL` (default `gemini-3.8-flash`) Vision.
- When key is absent or model fails: Returns honest Basic Mode architectural checklist with `isAiInspected: false`.
- Rate limit: 4/min.

### POST /api/ask
Bounded follow-up Q&A with rate limiting, prompt injection defenses, and medical refusal guardrails.
- Body limit: 16 kB.
- Rate limit: 8/min.
- Refuses medical diagnoses and off-topic prompts with safe disclaimers.

### POST /api/bulletin
Generates bilingual (English / Hindi) WhatsApp RWA advisory bulletins with 1-tap copy text. Rate limit: 10/min.

---

## 5. Security & Rate Limiting

- **Rate Limiting**: `TokenBucketLimiter` with `MemoryBucketStore`.
- **Client Identification**: SHA-256 hashed `(Client IP + CLIENT_IP_SALT)`. Raw IPs are never logged or stored.
- **Payload Boundaries**: Streamed size checks abort with HTTP 413 before Zod parsing.
