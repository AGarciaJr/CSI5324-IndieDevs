# CSI5324-IndieDevs

The repository for CSI 5324.

## Fan community use cases (william)

The fan sidebar now includes **Following**, **My profile**, and **Report content**. Both the For You cards and artist profile dialog use backend-backed follow controls. Admins have a **Report queue** tab connected to the existing report-resolution service.

These workflows reuse the current `X-User-Id` mechanism and `AccessControlService`; this project still has persona switching rather than session login. The new UI maps legacy persona IDs to authoritative `user_accounts` IDs: first fan → 1, second fan → 5, artist → 2, admins → 3. Older appeal workflows keep their existing reviewer IDs. The legacy `fans` table remains unchanged; community data belongs to `UserAccount`.

All new operations persist through JPA, not localStorage. The existing default H2 database is in memory with `create-drop`, so data survives browser reloads but resets when the backend restarts. No database config or existing API contracts were replaced.

### API

All routes below require `X-User-Id` for an active FAN, except `/profiles/{id}`, which accepts any active viewer. Base: `/api/fan-community`.

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/following` | Current fan's followed artist list, counts, and availability |
| GET / PUT / DELETE | `/artists/{artistId}/follow` | Read, idempotently follow, or unfollow |
| GET / PUT | `/profile` | Read/edit own profile; save with the returned `version` |
| GET | `/profiles` | Visible fan directory (names for the profile picker) |
| GET | `/profiles/{fanId}` | Server-filtered profile; private/unavailable profiles return 404 |
| GET | `/report-targets` | Visible accounts, public posts, and published events |
| POST | `/report-evidence` | Capture server evidence using `targetType` and `targetId` |
| POST | `/artists/{artistId}/report-evidence` | Resolve an artist profile to its account and capture evidence |
| POST / GET | `/reports` | Submit a report / list the current fan's reports |

Profile updates include `displayName`, `biography`, `interests`, `image`, `publicProfile`, `showInterests`, `showFollowing`, and `version`. Name is required (80 characters maximum), biography allows 2,000 characters, interests 300. Image is an uploaded PNG/JPEG data URL (500 KB; maximum 4096 pixels per side). Baseline profile content rules reject markup, script URLs, and explicit threats. Unsupported image formats, invalid fields, and stale edits are rejected without partial updates. Hidden interests and supported artists are omitted from other viewers' responses; owners retain access to their full profile.

Report submission uses `targetType` (`USER`, `POST`, `EVENT`), `targetId`, required `reason` (120 characters maximum), `details` (up to 2,000 characters), and optionally a captured `evidenceId`. Owner IDs and source snapshots are resolved by the server. An evidence ID is bound to its fan and target; it permits finishing a report after source content is removed, including hard deletion. Inaccessible or missing content without retained evidence is rejected. Pending duplicates return 409. Reports are immediately available through existing admin `/api/reports` endpoints, with the retained snapshot and details. Existing resolution actions, audit fields, and notifications are reused.

Follow writes and report submissions serialize on the acting account; follow pairs also have a database unique constraint. A follow records recommendation affinity once; unfollow removes only FOLLOW affinity. Profile writes are transactional with optimistic version checks. Storage errors preserve the old profile and the editor draft.

### Verification

- Backend: from `backend`, run `.\mvnw.cmd test` with JDK 21 or newer. Community tests cover access control, unavailable artists, duplicate and concurrent writes, privacy, image validation, stale updates, database rollback, report visibility, evidence ownership, and removed-content reporting. Existing destructive test fixtures now roll back their data changes.
- Frontend: from `frontend`, run `npm run lint` and `npm run build`.
- Browser integration: start fresh disposable seeded servers on ports 8080 and 3000, install/provide Playwright, then run `node tests/fan-community-smoke.cjs` from `frontend`. Optional environment variables: `PLAYWRIGHT_MODULE`, `BROWSER_EXECUTABLE`, `API_URL`, `WEB_URL`. The script creates test follow/profile/report data and resolves its test report. It checks live persistence, persona isolation, profile privacy/validation, report submission/duplicates/review, mobile overflow, and browser runtime errors. Screenshots go in ignored `frontend/test-results/`.

### Presentation navigation and compatibility

The fan view opens on **Discover**, with the original artist-name, genre/style, and location search fields visible immediately. **For You** still opens the existing recommendations screen. The original account switcher is now directly beneath the logo, rather than below the expanded sidebar navigation. All five original personas remain unchanged: Nicholas Nolen, Jordan Smith, William Waweru, Admin Alex, and Admin Garrett. Selecting a fan opens Discover, an artist opens Manage Events, and an admin opens Ban Appeals, preventing an incompatible previous tab from leaving an empty workspace.

The existing post composer, event create/edit screens, recommendations, appeal reviewer switching, artist suspension directory, verification applications, and demo catalogue remain in place alongside the new Following/Profile/Reports screens. Admin directory refresh uses the existing public artist-list endpoint with `includeSuspended=true`; fan search retains its role-checked search endpoint. Artist directory filtering uses the public artist list rather than impersonating a fan.

Run `node tests/presentation-regression.cjs` from `frontend` (same Playwright environment options as the community smoke test) to verify all five personas, default search visibility, live fan and artist search, the pre-existing screens, the added tabs, and mobile account switching. This test navigates existing data without modifying backend records.
