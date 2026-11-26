# =============================================================================
# scripts/smoke.ps1 — Clear Air Companion Production Smoke Test (PowerShell)
# Tests: health, ready, security headers, and basic-mode plans for 3 AQI levels.
# Satisfies: DEP-001, REL-003, SEC-002, NFR-003
# =============================================================================
param(
  [string]$BaseUrl = "http://127.0.0.1:3000"
)

$Failed = $false

Write-Host "====================================================================="
Write-Host "Running Production Smoke Tests against: $BaseUrl"
Write-Host "====================================================================="

function Test-Endpoint {
  param([string]$Name, [string]$Url, [int]$ExpectedStatus, [string]$MatchPattern)
  Write-Host -NoNewline "[TEST] $Name... "
  try {
    $res = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 10
    if ($res.StatusCode -eq $ExpectedStatus -and $res.Content -match $MatchPattern) {
      Write-Host "PASS (HTTP $($res.StatusCode))" -ForegroundColor Green
    } else {
      Write-Host "FAIL (Status: $($res.StatusCode), Pattern: $MatchPattern)" -ForegroundColor Red
      $script:Failed = $true
    }
  } catch {
    Write-Host "FAIL ($($_))" -ForegroundColor Red
    $script:Failed = $true
  }
}

# 1. Health
Test-Endpoint "Health Check (/api/health)" "$BaseUrl/api/health" 200 '"status":"ok"'

# 2. Readiness
Test-Endpoint "Readiness Check (/api/ready)" "$BaseUrl/api/ready" 200 '"status":"ready"'

# 3. Security Headers
Write-Host -NoNewline "[TEST] Security Headers Check... "
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/health" -Method Get -UseBasicParsing
  $csp = $res.Headers["Content-Security-Policy"]
  $xfo = $res.Headers["X-Frame-Options"]
  $xcto = $res.Headers["X-Content-Type-Options"]
  if ($csp -and $xfo -eq "DENY" -and $xcto -eq "nosniff") {
    Write-Host "PASS (CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff verified)" -ForegroundColor Green
  } else {
    Write-Host "FAIL (Headers missing or incorrect: CSP=$csp, XFO=$xfo, XCTO=$xcto)" -ForegroundColor Red
    $Failed = $true
  }
} catch {
  Write-Host "FAIL ($($_))" -ForegroundColor Red
  $Failed = $true
}

# 4. Basic-mode plan for 3 AQI overrides (50, 150, 350)
function Test-Plan {
  param([int]$Aqi, [string]$ExpectedBand)
  Write-Host -NoNewline "[TEST] Basic-mode Plan (AQI=$Aqi, expected band=$ExpectedBand)... "
  $body = @{
    profile = @{
      schemaVersion = 1
      members = @(@{ ageBand = "adult"; vulnerabilityFlags = @() })
      housingType = "well_sealed"
      hasPurifier = $false
      cookingFuel = "electric"
      heatingType = "electric"
      commuteTypes = @("work_from_home")
      budgetBand = "none"
    }
    aqi = $Aqi
    pm25 = [math]::Round($Aqi * 0.6)
    mode = "basic"
  } | ConvertTo-Json -Depth 5

  try {
    $res = Invoke-WebRequest -Uri "$BaseUrl/api/plan" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    if ($res.StatusCode -eq 200 -and $res.Content -match $ExpectedBand) {
      Write-Host "PASS (HTTP 200, contains '$ExpectedBand')" -ForegroundColor Green
    } else {
      Write-Host "FAIL (Status: $($res.StatusCode), expected band: $ExpectedBand)" -ForegroundColor Red
      $script:Failed = $true
    }
  } catch {
    Write-Host "FAIL ($($_))" -ForegroundColor Red
    $script:Failed = $true
  }
}

Test-Plan 50 "good"
Test-Plan 150 "usg"
Test-Plan 350 "hazardous"

Write-Host "====================================================================="
if (-not $Failed) {
  Write-Host "ALL SMOKE TESTS PASSED SUCCESSFULLY" -ForegroundColor Green
  exit 0
} else {
  Write-Host "SMOKE TESTS FAILED" -ForegroundColor Red
  exit 1
}
