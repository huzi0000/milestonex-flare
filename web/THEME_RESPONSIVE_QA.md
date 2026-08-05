# Theme and Responsive Stability QA

**Date:** 2026-08-05  
**Purpose:** Verify the final authoritative theme layer and responsive layout after removing legacy hard-coded overrides.

## Theme toggle functional test

The dashboard was opened in light mode, toggled to dark mode, and reloaded.

| Property | Light | Dark |
|---|---|---|
| `data-theme` | `light` | `dark` |
| Top bar background | `rgba(248, 251, 249, 0.97)` | `rgba(4, 14, 10, 0.97)` |
| Primary heading | `rgb(10, 28, 20)` | `rgb(239, 250, 244)` |
| Persisted setting | `light` | `dark` |

After reload, the page remained in dark mode. The preference is initialized in each HTML document before React starts, avoiding a light-mode flash.

## Explicit dark-mode coverage

The final `stability-v4.css` is loaded last and explicitly themes:

- Dashboard top bar and mobile header
- Deployment header
- Lifecycle header
- Main page and footer
- Statistics and project cards
- Project detail surfaces
- Project builder inputs and selects
- Activity cards
- Network/settings cards
- Deployment panels and manifest
- Lifecycle proof, role, and state panels
- Buttons, status indicators, code blocks, and placeholders

Critical dark surfaces use explicit hexadecimal/RGBA values rather than relying on `color-mix()` browser support.

## Responsive layout verification

Pages tested:

- Dashboard
- Project detail
- Project builder
- Activity
- Network/settings
- Infrastructure/deployment
- Lifecycle proof

Target widths:

- 320 px
- 390 px
- 768 px
- 900 px
- 1024 px
- 1440 px

Verified behaviors:

- Body width never exceeds viewport width
- Application roots clip transformed drawer internals
- Mobile navigation replaces desktop sidebar at 900 px
- Statistics reflow to two columns, then one column at 350 px
- Hero image moves below content on tablets/phones
- Project, overview, create, deployment, and lifecycle grids become one column
- Network/settings status moves below its content instead of clipping
- Long hashes and addresses truncate safely
- Lifecycle progress becomes a 3×2 phone grid
- How-it-works rail becomes vertical on phones
- Wallet and theme controls collapse without overlapping

## Network resilience

If the public Coston2 RPC is temporarily rate-limited or rejects browser CORS:

- Dashboard uses the independently verified Project #1 snapshot
- FTSOv2/FXRP cards use the last verified network snapshot
- Lifecycle page uses the machine-verified Project #1 record
- Deployment page uses the published deployment manifest

Live data automatically replaces fallback data when the RPC is available.
