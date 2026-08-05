# MilestoneX Responsive and Visual QA

**Audit date:** 2026-08-04  
**Build:** Unified MilestoneX design system

## Pages tested

- Main live dashboard
- Live project detail
- Project-creation preview
- Activity view
- Network view
- Verified-infrastructure page (`/deploy.html`)
- Verified-lifecycle page (`/lifecycle.html`)

## Viewports tested

| Width | Representative device | Result |
|---:|---|---|
| 320 px | Small phone | Pass |
| 360 px | Android phone | Pass |
| 390 px | Modern iPhone | Pass |
| 430 px | Large phone | Pass |
| 768 px | Portrait tablet | Pass |
| 900 px | Large tablet/small laptop | Pass |
| 1024 px | Tablet landscape/laptop | Pass |
| 1280 px | Laptop/desktop | Pass |
| 1440 px | Desktop | Pass |

## Theme and motion coverage

- Light theme tested on dashboard, infrastructure, lifecycle, project, and creation views
- Dark theme tested on dashboard, infrastructure, lifecycle, project, and creation views
- Theme preference persists through `localStorage` and initializes before React to prevent a color flash
- System color preference is respected on first visit
- Motion is disabled automatically when `prefers-reduced-motion: reduce` is active
- Logo route, card-entry, status, success, ambient-network, hero-image, FXRP-token, and workflow-rail animations use transform/opacity rather than layout-changing properties
- Original hero artwork uses responsive `object-fit` cropping and WebP delivery
- Agree → Lock → Prove → Release changes from a horizontal animated rail to a vertical mobile flow
- Judge Mode becomes a full-screen mobile experience with compact progress, stacked evidence, and fixed navigation
- Judge Mode supports Escape, left-arrow, and right-arrow keyboard controls

## Automated checks

- No visible horizontal overflow in page bodies or application roots
- No React duplicate-key warnings
- No uncaught page errors
- No browser-console errors during audited flows
- Production TypeScript/Vite build passes
- Mobile navigation becomes an off-canvas menu at tablet width
- Main dashboard statistics use a two-column mobile layout and four-column desktop layout
- Long evidence hashes are shortened in visible controls while remaining copyable
- Lifecycle progress becomes a two-row, six-step grid on phones
- Deployment and lifecycle evidence are readable without connecting a wallet

## Brand consistency

The selected **Milestone Rise** identity uses a four-stage ascending path and arrow, matching the Agree → Lock → Prove → Release workflow.

All pages use the same shared component:

`src/components/BrandLogo.tsx`

The milestone-route symbol, gradient, node geometry, typography, spacing, animation, and wordmark remain identical across:

- Sidebar
- Mobile application header
- Deployment/infrastructure header
- Lifecycle header
- Footer

Light/dark tone changes are limited to contrast requirements; logo geometry remains unchanged.

## Responsive principles

- Minimum supported width: 320 px
- Desktop sidebar collapses to an accessible mobile drawer at 900 px
- Cards reflow rather than scale down illegibly
- Core body text remains readable on phones
- Primary actions become full-width on narrow screens
- Proof and receipt grids collapse from columns to stacked cards
- No interaction requires hover
- Wallet secrets are never requested by the interface
