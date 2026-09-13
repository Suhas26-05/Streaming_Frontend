# Observed Bugs

This document records issues observed during the UI refresh. These items were intentionally not fixed because the request was limited to visual updates.

## Confirmed From Source Review

- **Watchlist and Settings navigation is not interactive.** The sidebar renders these entries as `span` elements with no route, click handler, or link, so they present as navigation options but cannot be opened.
- **Pending profile selection has no visible escape path.** After a non-admin login returns multiple profiles, the profile-choice view is rendered without the sidebar and receives a no-op logout handler. A user cannot cancel the selection or return to the login screen from that state.
- **Profile deletion has no confirmation step.** Clicking `Delete` immediately sends the delete request, so an accidental click can remove a profile without a confirmation dialog or undo action.
- **Profile numbering is not stable for two-digit IDs.** The `0{profile.id}` presentation produces values such as `010` for profile ID `10`, rather than a consistent two-character number.

## Content And Accessibility Observations

- **Browser title is inconsistent with the product branding.** The document title is `P Streaming Auth`, while the visible application branding is `CineVibe`.
- **Profile and active-profile images use empty alternative text.** This prevents screen readers from conveying useful profile information when an image URL is provided.

## Verification Limits

- The frontend production build completed successfully with `npm run build`.
- The landing/auth view rendered at desktop and mobile viewport sizes.
- API-dependent flows, including signup, login, profile selection, profile updates, deletion, and logout, were not executed because they require a running backend and test data.
