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

## 2026-04-15 10:08 IST

### D-036: Media-Rich Detail Pages (Trailers + Photo Backdrops)
- Decision: Enrich title responses with a computed `media` object (YouTube embed queries + backdrop image URLs) in the service layer and render cinematic detail pages with trailer embeds, photo wall, and fullscreen photo preview.
- Alternatives considered:
  - Frontend-only generation without backend enrichment.
  - External paid media API integration in MVP.
- Rationale: You requested YouTube trailers/clips and internet photos with strong visual impact while keeping current architecture flow intact.
- Impact: Detail pages now feel immersive with dynamic video and image media, while still working in fallback mode through frontend media defaults.

## 2026-04-15 10:21 IST

### D-037: Immersive Full-Screen Detail Backdrop Treatment
- Decision: Render detail-page background as an oversized fixed image layer with stronger black gradient + vignette overlay and blur to create an immersive full-screen look beyond visible viewport edges.
- Alternatives considered:
  - Keep standard full-viewport image without overscale.
  - Use a lighter transparent overlay with minimal blur.
- Rationale: You requested a background that extends beyond browser bounds and feels blacked-out/blurred while keeping detail content readable.
- Impact: Detail pages now have deeper cinematic focus and better text contrast on dynamic artwork backgrounds.

## 2026-04-15 10:34 IST

### D-038: Remove Detail Fullscreen Control, Keep Full-Screen Art Background
- Decision: Remove the explicit `View Full Screen` control from detail pages while retaining the immersive full-screen album-art backdrop treatment.
- Alternatives considered:
  - Keep fullscreen button alongside cinematic backdrop.
  - Remove cinematic backdrop and keep fullscreen-only behavior.
- Rationale: You clarified that fullscreen should refer to artwork filling the background, not a user-triggered fullscreen mode.
- Impact: Cleaner detail-page controls with the intended immersive background preserved by default.

## 2026-04-15 10:41 IST

### D-039: Silent Fallback Mode Messaging
- Decision: Remove the explicit UI notice `Live API unavailable. Showing fallback snapshot data.` while preserving automatic fallback content loading.
- Alternatives considered:
  - Keep fallback notice visible to all users.
  - Disable fallback mode entirely.
- Rationale: You requested cleaner UI without this status line while retaining resilience.
- Impact: App continues to serve fallback data when API is unavailable, but without showing that specific banner text.

## 2026-04-15 10:47 IST

### D-040: Reliable Detail Background Image Fallback Chain
- Decision: Implement ordered background candidate loading on detail pages with automatic image-failure fallback (`posterUrl -> media backdrops -> generated fallback`) using `onError` rollover.
- Alternatives considered:
  - Keep single background URL and accept blank states on load failures.
  - Resolve only server-side and remove frontend fallback behavior.
- Rationale: You reported missing album-art backgrounds; URL availability varies by source, so resilient client-side fallback ensures consistent visual output.
- Impact: Detail pages now reliably show background artwork even when a primary backdrop URL is broken or blocked.

## 2026-04-15 11:02 IST

### D-041: Remove Raw Connector Path Text from User-Facing Descriptions
- Decision: Replace JustWatch connector synopsis text with user-friendly copy and add frontend cleanup for legacy strings matching `Trending title discovered from JustWatch path ...`.
- Alternatives considered:
  - Keep raw ingestion text and rely on future re-scrapes only.
  - Remove synopsis entirely from detail pages.
- Rationale: You reported poor-quality description text leaking source-path internals into UI.
- Impact: Existing rows render cleaner descriptions immediately, and new ingested rows use human-readable synopsis text by default.

## 2026-04-15 11:16 IST

### D-042: Validate Media Link Readiness Before Display
- Decision: Add service-layer media URL validation (HEAD with GET fallback), short timeout, in-memory TTL cache, and concurrency limits; return only validated trailer/image links to the frontend.
- Alternatives considered:
  - Display all generated links without readiness checks.
  - Validate only in frontend on render.
- Rationale: You requested showing media only when links are actually available.
- Impact: Fewer broken media embeds/images in detail pages, with fallback media preserved for resilience.

## 2026-04-16 00:14 IST

### D-043: Replace Unreliable Embedded Video Tiles with Verified Watch Links + Client Photo Preload
- Decision: Replace detail-page YouTube iframe tiles with open-in-new-tab watch links and pre-validate photo-wall images in the browser before rendering.
- Alternatives considered:
  - Keep iframe embeds and rely only on URL reachability checks.
  - Render all photo URLs without browser-side load verification.
- Rationale: Some reachable YouTube/image URLs still fail to embed/render in-browser; this approach avoids broken media blocks.
- Impact: Trailer section now shows reliable watch actions, and photo wall displays only successfully loaded images.

## 2026-04-16 00:26 IST

### D-044: Top-Left Logo as Home Navigation Control
- Decision: Make the `CHILL ZONE` topbar logo act as a home navigation trigger with mouse and keyboard accessibility.
- Alternatives considered:
  - Keep logo as static branding text only.
  - Add a separate extra home icon near the logo.
- Rationale: You requested that clicking the logo should take users to the home page.
- Impact: Faster navigation to home and improved topbar usability without adding extra UI clutter.

## 2026-04-16 00:34 IST

### D-045: Relevance-First Photo Wall (No Generic Fallback Images)
- Decision: Restrict detail-page Photo Wall to title-linked media URLs only (poster/backdrop source art) and remove generic random-image fallbacks.
- Alternatives considered:
  - Keep random fallback images to always fill gallery slots.
  - Show mixed source images even if weakly related.
- Rationale: You reported irrelevant photos in Photo Wall; relevance is more important than always-filled tiles.
- Impact: Photo Wall now hides when no relevant images are available instead of displaying unrelated visuals.

## 2026-04-16 23:43 IST

### D-046: User-Controllable NSFW Content Filter
- Decision: Add service-layer `isNsfw` enrichment (heuristic classification) and a topbar `Allow 18+` switch (default OFF, persisted in `localStorage`) that filters hero, zone cards, and detail routing.
- Alternatives considered:
  - Hard-block adult titles with no user override.
  - Frontend-only filtering without backend content flags.
- Rationale: You requested filtering 18+ content by default while still allowing an explicit opt-in switch for users.
- Impact: Safer default browsing experience with user choice preserved; same filtering behavior is consistently applied across list/detail/hero views.

## 2026-04-16 23:56 IST

### D-047: End-to-End IMDb Rating Field and UI Exposure
- Decision: Add nullable `imdb_rating` to title persistence and API payloads, ingest rating from connector context when available, and render `IMDb` rating on cards, hero, and detail pages with `N/A` fallback.
- Alternatives considered:
  - Client-only inferred rating without DB persistence.
  - Hide rating element when missing.
- Rationale: You requested IMDb rating visibility across home, other listing surfaces, and detail pages; persisting at the backend keeps responses consistent and avoids repeat parsing on every render.
- Impact: Unified rating display across UI surfaces, backward-compatible null handling for missing ratings, and easier future connector upgrades for higher rating accuracy.

## 2026-04-17 00:12 IST

### D-048: Dedicated IMDb Enrichment and Admin Backfill Path
- Decision: Add a dedicated IMDb connector (suggestion lookup + GraphQL ratings fetch, with HTML fallback), enrich movies/series during scrape, and expose an admin-only `backfill-imdb-ratings` endpoint/UI action for existing rows.
- Alternatives considered:
  - Keep heuristic in-page parsing from source connectors only.
  - Manual SQL updates for ratings without API workflow support.
- Rationale: You reported persistent `IMDb: N/A`; this required a real secondary metadata enrichment pass rather than relying on sparse source snippets.
- Impact: New and existing catalog entries can now be populated with real IMDb ratings through a repeatable admin workflow, while preserving architecture layering and safe fallback behavior.

## 2026-04-19 14:40 IST

### D-049: Remove IMDb Rating Feature Due to Reliability and Compliance Risk
- Decision: Remove all `imdbRating` ingestion, persistence, API exposure, admin backfill flow, and frontend rendering; keep non-rating metadata flows intact.
- Alternatives considered:
  - Keep existing IMDb GraphQL/HTML scraping path and retry with connector tweaks.
  - Keep `imdbRating` schema/API fields with permanent `N/A` UI fallback.
- Rationale: Rating acquisition depended on brittle and challenge-prone scraping/undocumented endpoints and produced unstable availability; removing the feature is safer than serving unreliable metadata.
- Impact: No IMDb rating appears in cards/hero/detail/admin flows, contracts are simplified, and scrape/list behavior remains stable for titles/links/media.

## 2026-04-19 14:48 IST

### D-050: Auto-Migrate Existing DBs by Dropping `titles.imdb_rating`
- Decision: Execute `ALTER TABLE titles DROP COLUMN IF EXISTS imdb_rating` during DB initialization.
- Alternatives considered:
  - Leave legacy column in place as unused data.
  - Require a manual one-off SQL migration outside app startup.
- Rationale: You explicitly asked to remove IMDb rating data completely; startup migration keeps all environments consistent without manual intervention.
- Impact: Existing databases automatically remove the obsolete rating column on next backend boot.

## 2026-04-19 15:09 IST

### D-051: Mobile Detail Page Gutter + Readability Refinement
- Decision: Improve detail-page mobile spacing and content hierarchy by tightening responsive gutters, preventing overflow, introducing structured meta chips, and converting raw link lines into touch-friendly cards.
- Alternatives considered:
  - Only increase global shell padding.
  - Keep existing typography and adjust spacing minimally.
- Rationale: Detail view felt cramped on mobile and text blocks lacked clear visual structure, making information harder to scan.
- Impact: Mobile detail layouts now preserve side padding consistently, and detail text/link sections are easier to read and visually cleaner.

## 2026-04-19 15:23 IST

### D-052: Native-Style Mobile UI Chrome and Detail Layout Refresh
- Decision: Introduce a mobile-first visual pass for top navigation and detail view: compact glassy header, safe-area-aware spacing, removal of duplicate top nav actions (Home/Browse) on mobile, and stronger card/typography rhythm for detail content.
- Alternatives considered:
  - Keep existing desktop-first header behavior with minor spacing tweaks.
  - Move all controls into one expanded mobile header row.
- Rationale: Mobile view looked crowded and non-native due to wrapped controls and dense content blocks.
- Impact: Cleaner app-like mobile composition, improved readability, and better touch ergonomics while preserving desktop layout.
