# Live Event Visualization Design

**Date:** 2026-10-09  
**Status:** Approved  
**Primary display:** 16:9 public event screen  
**Public route:** `/live`

## Goal

Create a cinematic, read-only visualization for AWS Community Day Guatemala that makes the community's activity visible at a distance. The screen combines a Three.js network of attendee QR connections, a consent-safe photo gallery, track preferences, and concise live insights.

The experience must feel alive without becoming visually noisy, remain useful during temporary connectivity problems, and expose no private attendee data.

## Experience

The page uses a dark, atmospheric adaptation of the existing GuateGeeks teal, orange, and green palette. The event and GuateGeeks identities remain visible in a compact header alongside a live-status indicator and the last successful refresh time.

The layout is a single cinematic dashboard:

- The left 60–65% contains a Three.js community cloud.
- The upper-right contains an editorial gallery of three approved images.
- The lower-right contains track-preference bars and a rotating insight.
- A bottom pulse strip shows connected participants, QR connections, approved photos, and the leading track.

Supporting content rotates within its panel. The entire screen does not change scenes, so viewers always retain context and the network remains the visual anchor.

## Community cloud

Each attendee who participates in a valid QR connection appears as a node. A line joins the two nodes involved in each recorded connection.

- Nodes use opaque public IDs internally and display only public aliases.
- Node size reflects connection count.
- Node color and shape treatment identify attendee profile category; the legend also names categories so color is not the sole carrier of meaning.
- Highly connected nodes receive a restrained halo.
- New connections briefly pulse when a refreshed snapshot introduces an edge.
- The cloud slowly rotates on an automatic camera path suitable for an unattended display.
- A small number of contextually important aliases are labeled at once to avoid clutter.

The renderer uses Three.js `InstancedMesh` for nodes and batched line geometry for edges. Positions are deterministic from the opaque node ID, so the cloud does not jump when a snapshot refreshes. The number of nodes and edges is capped and sampled server-side to preserve frame rate.

When `prefers-reduced-motion` is active, automatic orbiting and pulses stop. The static graph, legend, and all statistics remain available.

## Gallery, tracks, and insights

The gallery displays only photos that satisfy all of the following:

1. the submission belongs to the current event;
2. moderation status is approved;
3. the participant's current `photoPublication` consent is true;
4. the storage object still exists and can receive a short-lived URL.

Three images are presented as a large feature tile plus two supporting tiles. The set crossfades periodically and uses `object-fit: cover`; missing dimensions or images cannot shift the layout. Attribution is limited to the participant's alias.

Track bars are derived from completed C12 responses and show a maximum of six configured tracks. Each bar includes a label, count, and percentage. The leading track is also surfaced in the pulse strip.

Insights are deterministic summaries derived from the same sanitized snapshot, for example the most connected profile pairing or the rate of new QR connections. They never infer sensitive traits and never reveal private responses.

## Public data boundary

The browser does not receive direct read access to `users`, `connections`, `submissions`, `challengeProgress`, or Storage evidence paths. A new unauthenticated callable function, `getPublicEventVisualization`, returns a bounded, sanitized snapshot.

The response contains:

- `generatedAt` and event identifier;
- nodes with opaque deterministic IDs, alias, profile category, and degree;
- edges containing only opaque source and target IDs;
- gallery items with alias, opaque same-origin media URL, and optional dimensions;
- track labels, counts, and percentages;
- aggregate totals and deterministic insight strings.

It never contains raw Firebase UIDs, emails, consent records, Storage paths, moderation notes, or unapproved submissions. Opaque IDs are produced with a server-side one-way digest scoped to this visualization.

The function queries current event data, applies privacy filtering, limits payload size, and returns opaque `/live-media/<photo-id>` URLs. A separate media function resolves those IDs server-side, rechecks approval and current consent, validates the object, and streams the image without exposing its Storage path. The client polls approximately every 20 seconds. A single in-flight request is allowed, and responses are schema-validated before becoming visible.

## Components and boundaries

- `LiveEventPage`: owns loading, refresh, stale-data, and full-screen presentation state.
- `usePublicVisualization`: polls the callable endpoint, validates snapshots, retains the last successful result, and detects newly introduced edges.
- `CommunityCloud`: owns the Three.js renderer lifecycle and renders nodes, edges, labels, and reduced-motion behavior.
- `PhotoGallery`: cycles gallery groups without layout shift and handles failed images locally.
- `TrackPulse`: renders accessible horizontal comparisons with direct values.
- `EventInsight`: cycles server-provided safe insights.
- `LiveMetrics`: renders the four large summary values.
- `public-visualization` function module: collects, filters, anonymizes, aggregates, bounds, and returns public data.
- `getPublicEventImage`: reauthorizes each opaque gallery request and proxies only a currently eligible image.

Pure server helpers handle graph normalization, track aggregation, and safe insight generation so they can be unit tested without Firebase.

## States and recovery

- Initial load: branded skeleton layout with a clear status message.
- Empty event: an intentional “The community cloud is forming” state with zeroed metrics.
- Partial data: available sections render; missing gallery or tracks use dedicated empty states.
- Refresh failure after success: keep the last snapshot and show a discreet reconnecting indicator.
- Initial failure: show a branded recovery view and retry automatically, with a manual retry button for smaller interactive screens.
- WebGL unavailable: replace the 3D canvas with an accessible 2D constellation generated from the same nodes and edges.
- Image failure: remove only the failed tile and continue rotating remaining approved images.

## Accessibility and public-display behavior

The page uses semantic headings and a text summary of the graph for assistive technology. Charts use direct labels and counts. Text maintains WCAG AA contrast, and no essential information depends on motion or color.

The page is responsive but optimized for 1920×1080 and other 16:9 displays. Typography and data values use viewport-aware clamps with minimum readable sizes. It supports browser full-screen use, avoids pointer-dependent interactions, prevents display sleep only through the venue's device settings, and does not add controls that distract from the presentation.

## Testing

Test-driven implementation covers:

- public route access without authentication;
- server filtering for approval and publication consent;
- absence of raw user IDs, emails, consent objects, and storage paths;
- graph normalization, deterministic opaque IDs, limits, and track aggregation;
- stale snapshot retention and refresh recovery;
- empty, loading, partial, and WebGL-fallback states;
- reduced-motion behavior;
- gallery failure handling and direct track labels;
- renderer cleanup on unmount and no duplicate animation loops.

Verification includes unit and integration suites, TypeScript checks, production builds for the app and functions, and a 16:9 browser smoke test at 1920×1080.

## Out of scope

- Public attendee profiles or contact information.
- Manual graph navigation as a requirement for the venue display.
- Facial recognition, image analysis, or AI-generated attendee descriptions.
- Historical multi-event comparison.
- A public API beyond the bounded visualization snapshot.
