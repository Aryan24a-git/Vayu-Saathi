# Security Audit & Vulnerability Assessment
> Document Version: 2.0.0 | Date: 2026-11-24  
> Authoritative Evaluation per AGENTS.md § 2 (P8/P9) and Evaluation Criterion EC-003

---

## 1. Executive Summary & Release Gate Verdict

| Item | Result |
|---|---|
| **Authoritative Gate Verdict** | **`BLOCKED - MANUAL ACTION REQUIRED`** |
| **Zero Severity Downgrade Policy** | **ENFORCED** (No severity downgrades permitted) |
| **Open Vulnerabilities (Total)** | 15 (4 Critical, 6 High, 5 Moderate) |
| **Production Runtime Dependencies Affected** | `zod@3.25.76` (1 High), `next@14.2.35` (Transitive) |
| **Development / Test Dependencies Affected** | `vitest@2.1.9`, `eslint-config-next@14.2.24`, `tinypool` |
| **Client Bundle Secret Leaks** | **0 (VERIFIED: Zero client-side leakage)** |
| **Security Headers Applied** | **VERIFIED (CSP, nosniff, DENY, same-origin, permissions)** |
| **Zero Server Persistence** | **VERIFIED (LocalStorage only, no DB, coords rounded)** |

> [!CAUTION]
> **Production Block Condition**: Per AGENTS.md and the Project Non-Negotiables, any open CRITICAL or HIGH vulnerability in the dependency tree prohibits automated `PRODUCTION READY` clearance. Shipped runtime dependencies (`zod@3.25.76` and `next@14.2.35`) contain upstream advisories that can only be resolved by major version upgrades (`zod@4` / `next@16`). Until written human risk acceptance is recorded, the release state is **`BLOCKED - MANUAL ACTION REQUIRED`**.

---

## 2. Comprehensive Dependency Vulnerability Inventory (`npm audit`)

| Package | Severity | Advisory ID | CVE / Title | Affected Versions | Fix Version | Shipped in Prod Bundle? |
|---|---|---|---|---|---|---|
| `zod` | **HIGH** | GHSA-mrhx-c7xc-m3w5 | Memory exhaustion on oversized collections | `<4.6.6` | `4.6.7` (Major) | **Yes** (Runtime) |
| `@vitest/coverage-v8` | **CRITICAL** | Transitive | via `vitest` / `test-exclude` | `<=3.2.7` | `5.1.1` (Major) | No (Dev-only) |
| `vitest` | **CRITICAL** | GHSA-5xrq-8626-4rwp | UI server arbitrary file read / execute | `<3.2.6` | `5.1.1` (Major) | No (Dev-only) |
| `vitest` | **MODERATE** | GHSA-82fw-gwwq-j7x9 | Path traversal via mocker redirect | `>=2.1.0 <4.1.11` | `5.1.1` (Major) | No (Dev-only) |
| `tinypool` | **CRITICAL** | Transitive | via `vitest` thread pool | Upstream | `5.1.1` (Major) | No (Dev-only) |
| `glob` | **HIGH** | GHSA-5j98-mcp5-4vw2 | Command injection via glob CLI `-c/--cmd` | `>=10.2.0 <10.5.0` | `10.5.0` | No (Linter tool) |
| `glob` | **MODERATE** | GHSA-3g3m-2fjr-6pw4 | AbortSignal cancellation bypass | `<10.5.0` | `10.5.0` | No (Linter tool) |
| `eslint-config-next` | **HIGH** | Transitive | via `@next/eslint-plugin-next` -> `glob` | `14.0.5 - 15.0.0` | `16.4.6` (Major) | No (Dev-only) |
| `@next/eslint-plugin-next` | **HIGH** | Transitive | via `glob` | `14.0.5 - 15.0.0` | `16.4.6` (Major) | No (Dev-only) |
| `@vitest/mocker` | **MODERATE** | GHSA-82fw-gwwq-j7x9 | Path traversal in redirect mock | `>=2.1.0 <4.1.11` | `5.1.1` (Major) | No (Dev-only) |
| `@vitest/mocker` | **MODERATE** | GHSA-qxg6-89mg-rqv8 | Code injection via mock registration | `>=2.1.0 <4.1.12` | `5.1.1` (Major) | No (Dev-only) |
| `esbuild` | **MODERATE** | GHSA-67mh-4wv8-2f99 | Dev server cross-origin read | `<=0.24.2` | `0.25.0` | No (Build tool) |
| `vite` | **LOW / MOD** | GHSA-9jrq-w75r-8gcw | Cross-origin script execution in dev server | `<=6.4.3` | `6.4.4` | No (Dev-only) |
| `vite` | **MODERATE** | GHSA-rq7h-c2jc-7f22 | Files outside `server.fs.allow` served | `<=6.4.3` | `6.4.4` | No (Dev-only) |
| `vite` | **MODERATE** | GHSA-fx2h-pf6j-xcff | Windows alternate path deny bypass | `<=6.4.2` | `6.4.3` | No (Dev-only) |

---

## 3. Attack Surface & Practical Exploitability Analysis

### 3.1 Zod Memory Exhaustion (`GHSA-mrhx-c7xc-m3w5`, High)
- **Vulnerability**: Zod parsers without byte limits can be sent deeply nested or massive JSON arrays resulting in heap exhaustion.
- **Application Mitigation**: Every incoming API request passes through `readJsonBoundary(req, Schema, requestId)` in `src/server/security/limits.ts`.
- **Enforced Boundary**:
  - `MAX_BODY_BYTES = 16_384` (16 kB for JSON endpoints)
  - `MAX_AUDIT_BODY_BYTES = 262_144` (256 kB for Base64 photo audit)
  - If `Content-Length` or the streamed chunk exceeds these bytes, the server terminates reading and immediately returns HTTP 413 `PAYLOAD_TOO_LARGE` **before Zod is invoked**.
- **Practical Exploitability**: **Negligible in deployed application**.

### 3.2 Vitest UI / Mock Server (`GHSA-5xrq-8626-4rwp`, Critical)
- **Vulnerability**: Running the Vitest UI test runner exposes an unauthenticated development HTTP server.
- **Application Mitigation**:
  - `vitest` is strictly a `devDependency`.
  - The standalone production build (`node .next/standalone/server.js`) packages only `.next/standalone` and node production modules.
  - The test runner is never executed in production containers or environments.
- **Practical Exploitability**: **Zero in production deployment**.

### 3.3 Next.js 14 Upstream Framework Concerns
- **Image Optimizer SSRF**: Next.js image optimization is constrained. No `remotePatterns` or external domains are permitted in `next.config.mjs`. All images are served from local static assets or sanitized inline SVG data.
- **Body Parser Limits**: All Next.js App Router route handlers explicitly enforce stream boundaries.

---

## 4. Live Response Headers Probe Verification

**V2-30 Update (2026-11-26):** CSP is now per-request nonce-based via `src/middleware.ts`.
The static CSP in `next.config.mjs` has been removed for page routes. The nonce rotates per
request; the value below is illustrative.

```http
HTTP/1.1 200 OK
content-security-policy: default-src 'self'; script-src 'self' 'nonce-<rotated>' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
cross-origin-opener-policy: same-origin
permissions-policy: camera=(), microphone=(), geolocation=(self)
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
x-frame-options: DENY
```

> [!NOTE]
> **Accepted LOW Finding — `style-src 'unsafe-inline'`**: React's built-in style props and
> Tailwind's JIT output require inline styles. `'unsafe-inline'` on `style-src` is an accepted LOW
> finding documented here. It does not allow inline scripts. Script execution is strictly controlled
> by the per-request nonce. This was reviewed and accepted on 2026-11-26.

### Analysis of Protective Headers
1. **Content-Security-Policy (nonce-based)**: Per-request rotating nonce prevents any static inline script execution. `'strict-dynamic'` allows nonce-blessed scripts to load further scripts.
2. **X-Frame-Options: DENY**: Eliminates clickjacking risks across all browsers.
3. **X-Content-Type-Options: nosniff**: Prevents MIME-sniffing attacks on static and dynamic responses.
4. **Permissions-Policy**: Restricts camera, microphone, and restricts geolocation strictly to origin self.
5. **Cross-Origin-Opener-Policy: same-origin**: Isolates browsing context against Spectre-style attacks.

---

## 5. Token Bucket Rate Limiting Architecture

| Route | Capacity | Refill Interval | Storage | Key Hash |
|---|---|---|---|---|
| `/api/plan` | 6 req | 60 sec | `MemoryBucketStore` | SHA-256(IP + salt) |
| `/api/plan/narrate` | 6 req | 60 sec | `MemoryBucketStore` | SHA-256(IP + salt) |
| `/api/audit` | 4 req | 60 sec | `MemoryBucketStore` | SHA-256(IP + salt) |
| `/api/ask` | 8 req | 60 sec | `MemoryBucketStore` | SHA-256(IP + salt) |
| `/api/bulletin` | 10 req | 60 sec | `MemoryBucketStore` | SHA-256(IP + salt) |
| `/api/city-scenario` | 30 req | 60 sec | `MemoryBucketStore` | SHA-256(IP + salt) |
| `/api/geocode` | 30 req | 60 sec | `MemoryBucketStore` | SHA-256(IP + salt) |
| `/api/playbook` | 15 req | 60 sec | `MemoryBucketStore` | SHA-256(IP + salt) |

---

## 6. Secret Hygiene & Codebase Scan

- **Automated Bundle Scan**: Recursively scanned `.next/static`, `public/`, and source files for `AIzaSy` (Google API keys) and `GEMINI_API_KEY`.
- **Result**: `SCAN COMPLETE: ZERO CLIENT-SIDE LEAKS`.
- **Runtime Key Access**: `process.env.GEMINI_API_KEY` is loaded strictly on the server in `src/server/llm/geminiClient.ts`. No `NEXT_PUBLIC_` prefixes are used for secrets.

---

## 7. Data Privacy & Zero Server Persistence (DATA-001 to DATA-005)

1. **Zero Database**: There is no database, Redis server, or external persistent storage attached to this application.
2. **Device-Local Storage**:
   - Household profile data is stored in the user's browser `localStorage` (`vayusaathi_profile_v2`).
   - Pinboard community reports are saved strictly in `localStorage` (`vayusaathi_hotspots`).
3. **Coordinate Truncation**:
   - Geolocation coordinates are truncated to 2 decimal places (~1.1 km precision) before sending to Open-Meteo or geocoding APIs.
4. **No PII Transmission**: No user email, phone number, name, or street address is requested or processed.

---

## 8. Action Items for Human Sign-Off

To advance this release to `PRODUCTION READY`, the following manual actions must be executed:
1. **Risk Acceptance**: Human security owner must review the 15 `npm audit` advisories and record written risk acceptance for `zod@3` and `next@14` given the mitigating boundary protections.
2. **Environment Secret Provisioning**: Set `GEMINI_API_KEY` securely in cloud environment variables (e.g. Google Secret Manager / Cloud Run env).
3. **TLS & HSTS Enforcement**: Provision a valid TLS certificate and configure reverse proxy / Cloud CDN to enforce HTTP Strict Transport Security (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
