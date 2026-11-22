# ACCESSIBILITY.md — Clear Air Companion

## Standard
WCAG 2.1 Level AA

## Checklist

### A11Y-001: Semantic HTML, Keyboard, Focus

- [ ] All interactive elements are keyboard-accessible (Tab/Enter/Space)
- [ ] Visible focus indicator on all focusable elements (not just outline:none)
- [ ] Semantic landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>`
- [ ] Heading hierarchy: single `<h1>`, logical `<h2>`–`<h6>` nesting
- [ ] No `div` or `span` used as buttons without `role="button"` and keyboard handler
- [ ] Skip-to-content link as first focusable element

### A11Y-002: AQI Color + Contrast

- [ ] AQI band is NEVER conveyed by color alone
- [ ] Every AQI display includes: color + icon + text label (e.g., "🔴 Hazardous — AQI 342")
- [ ] All text contrast ≥ 4.5:1 (normal), ≥ 3:1 (large)
- [ ] AQI badge icons have `aria-label` (e.g., `aria-label="Air quality: Hazardous"`)
- [ ] Color palette passes AA for color-blind simulation

### A11Y-003: Forms

- [ ] Every `<input>`, `<select>`, `<textarea>` has an associated `<label>` (not just placeholder)
- [ ] Error messages use `aria-describedby` to associate with the field
- [ ] Required fields marked with `aria-required="true"` and visual indicator
- [ ] Form validation errors announced via `aria-live="polite"` or `role="alert"`
- [ ] Multi-step wizard: step progress announced to screen readers

### A11Y-004: Live Regions

- [ ] Loading state: `aria-live="polite"` region announces "Loading your air quality data..."
- [ ] Plan ready: announces "Your personalized plan is ready" when results appear
- [ ] Error: `role="alert"` for critical errors (provider down, geolocation denied)
- [ ] AQI update: announces new value when data refreshes

### A11Y-005: Responsive and Motion

- [ ] App reflows correctly at 320px viewport width (no horizontal scroll)
- [ ] App usable at 200% browser zoom (no content clipped)
- [ ] All tap/click targets ≥ 44×44px
- [ ] `prefers-reduced-motion` media query: no animations when set
- [ ] Touch targets have adequate spacing (≥ 8px between)

### A11Y-006: Plain Language

- [ ] All copy targets grade 8 reading level or below
- [ ] No jargon without explanation (AQI explained on first use)
- [ ] Every icon paired with visible text label
- [ ] Abbreviations expanded on first use (e.g., "PM2.5 (fine particles)")
- [ ] Medical/safety instructions in simple active sentences

## Implementation Guidelines

### Design Tokens
```css
/* tokens.css */
:root {
  --color-aqi-good: #00e400;         /* Green */
  --color-aqi-moderate: #ffff00;     /* Yellow */
  --color-aqi-usg: #ff7e00;          /* Orange */
  --color-aqi-unhealthy: #ff0000;    /* Red */
  --color-aqi-very-unhealthy: #8f3f97; /* Purple */
  --color-aqi-hazardous: #7e0023;    /* Maroon */
  --color-aqi-severe: #4a0010;       /* Dark Maroon */
  
  /* Always pair with text and icon: */
  --icon-aqi-good: "✓";
  --icon-aqi-moderate: "!";
  --icon-aqi-usg: "⚠";
  --icon-aqi-unhealthy: "⚠⚠";
  --icon-aqi-very-unhealthy: "✕";
  --icon-aqi-hazardous: "✕✕";
  --icon-aqi-severe: "🚨";
  
  /* Focus ring */
  --focus-ring: 0 0 0 3px #005fcc;
  
  /* Min tap target */
  --touch-target-min: 44px;
}
```

### AQI Badge Component Pattern
```tsx
// Always: color + icon + text
<div
  className={styles.aqiBadge}
  style={{ backgroundColor: `var(--color-aqi-${band})` }}
  aria-label={`Air quality: ${bandLabel} — AQI ${value}`}
  role="status"
>
  <span aria-hidden="true">{bandIcon}</span>
  <span>{bandLabel}</span>
  <span className={styles.aqiValue}>AQI {value}</span>
</div>
```

### Error Announcement Pattern
```tsx
<div role="alert" aria-live="assertive" className={styles.error}>
  {errorMessage}
</div>
```

### Loading Announcement Pattern
```tsx
<div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
  {isLoading ? "Loading your air quality data..." : ""}
</div>
```

## Testing

### Automated
- `@axe-core/playwright` runs in E2E suite on every critical page state
- Zero axe violations required to pass CI

### Manual Checklist
Run before each release:
- [ ] Navigate entire app with keyboard only
- [ ] Test with NVDA + Chrome (Windows)
- [ ] Test with 320px viewport (Chrome DevTools)
- [ ] Test with 200% zoom
- [ ] Test with Colour Contrast Analyser
- [ ] Test with Windows High Contrast mode
- [ ] Enable reduced motion in OS settings, verify no animations
