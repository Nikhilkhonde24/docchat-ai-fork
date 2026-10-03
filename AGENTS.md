# Project Guidance

## User Preferences

- Dark theme with a black background, bright yellow accent headlines, and white body text
- Topic framing: AI for backend developers — applications where users chat with their own documents
- High-contrast, bold display headlines paired with clean sans-serif body text

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- TanStack Router parent routes with children must render <Outlet />; a parent component that always returns its own view silently swallows the child route. Branch with useMatchRoute({ to: childPath, fuzzy: false }).
- The backend uses Enhanced Migration with a lexicographic migration chain; fold multiple pending migrations into the latest pending file when check-limit=1 and reference AccessControl.AccessControlState directly rather than hand-inlining its fields.
- Caffeine Inference: call Config.fromEnv<system>() inside a <system>-parameterised helper, model must be "router", and never collect or store an API key.
- OQL manual .payload extract functions returning a primitive need that type's <Type>Value module imported top-level (NatValue, IntValue, TextValue, PrincipalValue, BoolValue).
- A module-level let in Motoko must be a static expression; string concatenation with # fails with M0014.
- For hover-revealed controls, default to visible and hide only on hover-capable breakpoints (md:opacity-0 md:group-hover:opacity-100) so touch devices keep the control discoverable.
- When reopening a chat session, mirror the backend's stored documentIds into local selection state so composer-disabled logic and sidebar checkboxes match the actual answer context.
- pdfjs-dist 6.x: destroy() lives on the loading task, not PDFDocumentProxy; bundle the worker via ?url import; cast Uint8Array to BufferSource for crypto.subtle.digest under TS 5.8.
- Local preflight could not complete Internet Identity sign-in (II canister rejected the test anchor), so authenticated flows were not runtime-verified; the app's own test suite covers the signed-in journeys with a mocked actor.
