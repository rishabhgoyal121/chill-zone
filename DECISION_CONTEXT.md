# Decision Context

This document tracks major and minor project decisions, alternatives considered, rationale, and impact.

## 2026-04-15 02:40 IST

### D-001: Repository Setup
- Decision: Start from a monorepo with `frontend` and `backend` folders in one workspace.
- Alternatives considered:
  - Separate repositories for frontend/backend.
  - Backend-only bootstrap first.
- Rationale: Faster local development, easier shared scripts, and simpler onboarding for this project stage.
- Impact: Unified workflow with independent app boundaries.

### D-002: Required Backend Layering
- Decision: Enforce architecture flow `frontend -> api controller -> core controller -> service -> db`.
- Alternatives considered:
  - Collapse core + service into one layer.
  - Direct service calls from routes.
- Rationale: You explicitly requested this contract; this structure also improves maintainability.
- Impact: Slightly more files upfront, much cleaner scaling path.

### D-003: Account Provisioning
- Decision: Admin-only account creation for now. No public signup route.
- Alternatives considered:
  - Open self signup.
  - Invite-only via email token.
- Rationale: Lower abuse risk and easier moderation in early stage.
- Impact: Admin panel must include user creation controls.

### D-004: Content Refresh Cadence
- Decision: Use a mixed cadence: twice-daily incremental refresh plus Sunday full refresh.
- Alternatives considered:
  - Every 10 minutes.
  - Weekly-only refresh.
- Rationale: Balances freshness with scraping cost/risk.
- Impact: Scheduler needs two job types with different scopes.

## 2026-04-15 02:47 IST

### D-005: Storage Strategy for MVP
- Decision: Use a JSON file-backed repository for local MVP instead of introducing a full SQL database immediately.
- Alternatives considered:
  - PostgreSQL + ORM.
  - SQLite.
- Rationale: Zero infra friction in an empty workspace while preserving clean repository boundaries for easy migration.
- Impact: Fast start now; DB repository contracts keep migration path open.

### D-006: Auth and RBAC Baseline
- Decision: Email/password login with roles `super_admin`, `content_admin`, `moderator`.
- Alternatives considered:
  - Super admin only.
  - Open signup with a default user role.
- Rationale: Matches admin-created-only accounts and near-term moderation needs.
- Impact: Admin APIs now guarded by role middleware.

### D-007: Refresh Cadence Implementation
- Decision: Cron schedules set to twice daily incremental (`09:00`,`21:00`) and Sunday full refresh (`08:00`).
- Alternatives considered:
  - Single daily refresh.
  - Sunday-only full refresh.
- Rationale: Implements your preference for lower frequency than 10 minutes while keeping regular updates.
- Impact: Scheduler includes two independent job policies.

## 2026-04-15 02:56 IST

### D-008: Frontend Foundation
- Decision: Use React + Vite with shared `cn` utility and reusable primitive components (`Button`, `Card`).
- Alternatives considered:
  - Next.js full framework.
  - Plain React without shared primitives.
- Rationale: Fast build/start loop and clear path for design system growth.
- Impact: Frontend now has a component baseline for future features.

### D-009: Initial UX Scope in MVP
- Decision: Include in MVP UI: zone browsing, admin login, favourites, and admin operations (refresh/source toggles/user creation).
- Alternatives considered:
  - Browse-only first, admin later.
  - Admin-only first, no public browsing.
- Rationale: Delivers end-to-end product value immediately.
- Impact: Backend and frontend are both testable from day one.

## 2026-04-15 03:03 IST

### D-010: Link Trust Presentation Strategy
- Decision: Preserve both official and external watch links, but label each link with its type in the UI.
- Alternatives considered:
  - Only official links.
  - No distinction between link sources.
- Rationale: Matches your request to include official providers plus additional links while maintaining trust clarity.
- Impact: Users can prefer official providers; admins can still curate broader options.

### D-011: Validation Strategy During Setup
- Decision: Validate backend via `curl` smoke checks and validate frontend through production build.
- Alternatives considered:
  - Unit tests first.
  - Browser-only manual checks.
- Rationale: Fastest reliability check in a newly scaffolded project.
- Impact: Confirms basic end-to-end readiness for next feature iteration.

## 2026-04-15 03:29 IST

### D-012: Persistence Upgrade
- Decision: Replace JSON file storage with PostgreSQL repositories.
- Alternatives considered:
  - Keep JSON and postpone migration.
  - Use SQLite transitional store.
- Rationale: You explicitly requested Postgres now, and structured querying is needed for scale.
- Impact: Repositories are now async SQL-backed with table initialization and seed logic.

### D-013: Real Source Connectors Without TMDB
- Decision: Use scraped connectors: IMDb charts for movies/series and CrazyGames for games.
- Alternatives considered:
  - TMDB API.
  - API-only provider sources.
- Rationale: You requested no TMDB and real connector ingestion from day one.
- Impact: Ingestion now depends on live site availability and parser resilience.

### D-014: Script-Extended Links
- Decision: Generate scripted external search links (e.g., JustWatch/duckduckgo searches) in addition to official links.
- Alternatives considered:
  - Official links only.
  - External links disabled by default.
- Rationale: Matches your requirement for additional watch links while preserving label transparency.
- Impact: UI receives richer link sets with `official` and `external` flags.

## 2026-04-15 03:52 IST

### D-015: IMDb Connector Fallback
- Decision: Replace direct IMDb scraping with JustWatch scraping for movies/series because IMDb returned WAF challenge responses from this network.
- Alternatives considered:
  - Retry IMDb with rotating headers only.
  - Keep IMDb and accept empty data when blocked.
- Rationale: JustWatch was reachable and returned stable title paths for real ingestion.
- Impact: Movies/series are populated reliably; IMDb links are now generated as search links per title.

## 2026-04-15 04:09 IST

### D-016: Admin Scrape Job Visibility
- Decision: Add `recent scrape jobs` API and admin UI table to surface job history (time/source/type/title count/link count).
- Alternatives considered:
  - Keep logs backend-only.
  - Add external observability stack first.
- Rationale: Immediate operational visibility for admins without introducing more infrastructure.
- Impact: Faster debugging and confidence in scheduled/manual refresh behavior.

## 2026-04-15 04:27 IST

### D-017: Static Fallback Strategy for Hosting
- Decision: Generate `frontend/public/fallback-content.json` from current Postgres rows and auto-fallback in frontend when live API is down.
- Alternatives considered:
  - Hardcoded fallback fixture.
  - Backend-only mode with no static backup.
- Rationale: Guarantees visible content in Netlify even before laptop backend exposure is fully stable.
- Impact: Frontend now supports resilient offline-like content behavior.

### D-018: First Hosting Path
- Decision: Use Netlify for frontend deployment and Caddy + SSLIP for laptop backend exposure.
- Alternatives considered:
  - Single-server deploy for both frontend/backend.
  - Tunneling tools only.
- Rationale: Matches your requested stack and keeps deployment responsibilities separated.
- Impact: Requires router port forwarding and SSL termination on laptop.

## 2026-04-15 05:14 IST

### D-019: Production API Default Safety
- Decision: In production builds, remove localhost API default and use same-origin (`''`) unless `VITE_API_URL` is explicitly set.
- Alternatives considered:
  - Keep localhost default in all environments.
  - Hard fail when `VITE_API_URL` is missing.
- Rationale: Prevents browser local-network permission prompts and accidental localhost calls from hosted frontend.
- Impact: Safer production behavior with graceful fallback support unchanged.

## 2026-04-15 05:26 IST

### D-020: Image-Forward Colorful Frontend Refresh
- Decision: Shift UI to a vivid, animation-heavy design with generated poster imagery per title, colorful gradients, and pronounced hover interactions.
- Alternatives considered:
  - Keep minimal card-only presentation.
  - Add static image placeholders without motion.
- Rationale: You requested a highly colorful visual style with lots of images and animations.
- Impact: Stronger visual identity, improved engagement, and consistent image coverage even when scraped sources lack posters.

## 2026-04-15 05:38 IST

### D-021: Guaranteed Visual Image Rendering
- Decision: Use seeded remote image URLs for card posters with automatic fallback to generated SVG art on load failure.
- Alternatives considered:
  - Data-URI generated images only.
  - Manual static image asset library.
- Rationale: Ensures visibly rich cards across deployed browsers where data-URI rendering can be inconsistent.
- Impact: Stronger visual reliability and consistent image presence in UI cards.

## 2026-04-15 05:52 IST

### D-022: App Shell Navigation Upgrade
- Decision: Introduce top bar, bottom dock, left side navigation, and right contextual side pane using shadcn-style UI primitives.
- Alternatives considered:
  - Keep single-column content-only layout.
  - Add only one navigation surface.
- Rationale: You requested multiple navigation surfaces and a richer UI frame.
- Impact: Better discoverability and faster movement across zones/admin while preserving existing features.

## 2026-04-15 06:17 IST

### D-023: Detail-First Content UX
- Decision: Move length display to dedicated detail pages and keep listing cards clean.
- Alternatives considered:
  - Keep length metadata on cards.
  - Use modal instead of route-based detail page.
- Rationale: Cleaner browsing surface while preserving richer metadata on explicit user intent.
- Impact: Better scanability of lists and improved information architecture.

### D-024: Fullscreen Detail View
- Decision: Add fullscreen control on detail page using browser Fullscreen API.
- Alternatives considered:
  - No fullscreen option.
  - New tab only.
- Rationale: You requested immersive full-screen card viewing.
- Impact: Users can focus on single title details and media.

### D-025: Modern Visual Refresh
- Decision: Replace retro-looking visual treatment with cleaner modern glass/surface layout and restrained gradients.
- Alternatives considered:
  - Minor style tweaks only.
  - Keep existing vivid style as-is.
- Rationale: You requested the UI to no longer feel old/2005.
- Impact: Contemporary look with improved readability and hierarchy.

## 2026-04-15 06:26 IST

### D-026: Card Alignment Normalization
- Decision: Enforce consistent card row structure with clamped title/synopsis and bottom-aligned action row.
- Alternatives considered:
  - Keep natural content flow with variable card heights.
  - Hardcode fixed card heights.
- Rationale: Improves visual alignment without truncating entire cards aggressively.
- Impact: Cleaner, more uniform card grid and better scanability.

## 2026-04-15 06:37 IST

### D-027: Hero Carousel Upgrade
- Decision: Replace static hero copy with a large, content-driven carousel (autoplay, arrows, dots, and open-detail actions).
- Alternatives considered:
  - Keep static hero with CTA only.
  - Use a separate slider section below hero.
- Rationale: You requested a big hero section with carousel and richer top-of-page engagement.
- Impact: Stronger first impression and faster discovery of featured content.

## 2026-04-15 07:15 IST

### D-028: Remove Sidebar and Side Pane
- Decision: Remove left sidebar and right side pane and shift to a centered single-content layout.
- Alternatives considered:
  - Keep both side surfaces and restyle.
  - Keep only one side surface.
- Rationale: You explicitly requested removing both side elements for a cleaner experience.
- Impact: Less visual clutter and wider content focus area.

## 2026-04-15 07:28 IST

### D-029: Minimal Click-First Cards
- Decision: Remove card border emphasis and remove in-card action buttons; make entire card open details on click, with a top-right heart icon for favourites.
- Alternatives considered:
  - Keep explicit action buttons.
  - Keep bordered card style.
- Rationale: You requested cleaner cards with direct interaction and lightweight favourite control.
- Impact: Simpler visual hierarchy and faster browsing interactions.

## 2026-04-15 07:34 IST

### D-030: Card Text Simplification and Typography Emphasis
- Decision: Remove card subtext/synopsis from listing cards and emphasize centered, larger title text with a dedicated display-style font stack.
- Alternatives considered:
  - Keep synopsis and only enlarge title.
  - Keep existing font and adjust spacing only.
- Rationale: You requested cleaner cards with stronger centered typography and no subtext.
- Impact: Cards are now minimal and visually focused on title + artwork.

## 2026-04-15 07:39 IST

### D-031: Hover-Only Card Description
- Decision: Show synopsis as a hover-reveal overlay on card media instead of persistent subtext.
- Alternatives considered:
  - Keep no synopsis on cards at all.
  - Restore always-visible synopsis.
- Rationale: Matches request for hover-based description while preserving minimal card layout.
- Impact: Cleaner default card appearance with quick contextual info on hover.

## 2026-04-15 08:06 IST

### D-032: Curated Description Layer Over Scraped Synopsis
- Decision: Route all UI-facing description text through a cleanup and curation layer; use cleaned synopsis when readable, otherwise show zone-aware curated blurbs.
- Alternatives considered:
  - Render raw scraped synopsis directly.
  - Disable descriptions entirely in hover/hero.
- Rationale: You flagged that raw source text felt like noisy script copy; this preserves live data value while improving readability and tone.
- Impact: Card hover, hero carousel, and detail copy now present cleaner, friendlier descriptions with less scraper/provider noise.

## 2026-04-15 09:01 IST

### D-033: Source-Accurate Poster Pipeline
- Decision: Replace generic seeded card imagery with source-provided poster/thumbnail URLs (`posterUrl`) from connectors, persisted in Postgres and surfaced in both live API and fallback payload.
- Alternatives considered:
  - Keep random seeded image service per title.
  - Maintain manual static poster mappings.
- Rationale: You reported card images were not relevant to their titles; source-aligned media preserves trust and content accuracy.
- Impact: Card/hero/detail images now map to real title artwork when available, with generated artwork only as a resilient fallback.

## 2026-04-15 09:31 IST

### D-034: Global Metadata and Favicon Baseline
- Decision: Define browser metadata and social preview tags in `frontend/index.html` and serve a shared app favicon (`/favicon.svg`) from `frontend/public`.
- Alternatives considered:
  - Keep only title and viewport defaults.
  - Add per-route metadata only later.
- Rationale: You requested page metadata and favicon coverage for all pages; in this SPA, the index head provides consistent defaults across routes.
- Impact: Better browser tab identity, improved SEO/share previews, and consistent icon branding across the app.

## 2026-04-15 09:46 IST

### D-035: Shadcn-Style Button Standardization
- Decision: Standardize all primary UI controls on the shared shadcn-style `ui/button` component with explicit `variant` and `size` APIs, including carousel nav controls and favourite heart control.
- Alternatives considered:
  - Keep mixed custom button styles and only tweak colors.
  - Replace only primary buttons and leave icon controls as raw HTML buttons.
- Rationale: You requested modern shadcn buttons and the previous mixed approach created inconsistent visuals and interactions.
- Impact: Unified button look/feel, consistent hover/focus behavior, and easier future UI maintenance.
