# ArtistConnect - CSI5324 IndieDevs

ArtistConnect is a web application for independent artists and their fan communities. This guide explains how to install it on a local computer, run the frontend and backend, and reproduce the automated checks.

## 1. Install the prerequisites

Install these tools before cloning or running the application:

| Tool | Required version / purpose |
| --- | --- |
| [Git](https://git-scm.com/install/) | Used to clone the repository and select the project branch. |
| [Java Development Kit (JDK)](https://adoptium.net/temurin/releases/?version=21) | **JDK 21**. Install the full JDK, including `javac`, rather than only a Java runtime. The backend targets Java 21. |
| [Node.js and npm](https://nodejs.org/en/download) | Install an **LTS version of Node.js** with npm. The frontend requires **Node.js 20.9.0 or newer**. This minimum comes from the frontend's Next.js dependency. |
| Web browser | Used to open the application. Automated browser tests additionally need Playwright and Chromium; installation steps are below. |

Make sure `JAVA_HOME` points to your JDK installation directory, and that the JDK's `bin` directory is on your `PATH`. `JAVA_HOME` should point to the JDK folder itself, not its `bin` folder.

On Windows, use the JDK installer's environment-variable options if available. Otherwise, open **Edit the system environment variables > Environment Variables**, set `JAVA_HOME` to the installed JDK folder, and add `%JAVA_HOME%\bin` to `Path`. Open a **new terminal** after changing environment variables.

Check the installations:

```text
git --version
java -version
javac -version
node --version
npm --version
```

Both Java commands should report version 21. Node must be at least 20.9.0. If a command is not recognized, fix that installation or its `PATH` before continuing.

You do **not** need to install Maven separately: `backend/mvnw.cmd` (Windows) and `backend/mvnw` (macOS/Linux) download the configured Maven version. You also do **not** need to install a database: the backend starts an embedded H2 database and loads sample data automatically.

An internet connection is required for the initial npm installation, Maven/dependency downloads, and optional Playwright browser download. The backend currently uses Spring Boot `4.1.2-SNAPSHOT`, including the Spring snapshot repository configured in `backend/pom.xml`.

## 2. Clone the project

In a terminal, change to the parent folder where you want the project, then run:

```text
git clone --branch william https://github.com/AGarciaJr/CSI5324-IndieDevs.git
cd CSI5324-IndieDevs
git branch --show-current
```

The last command should print `william`, the branch containing the implementation described here. If you already have a checkout, use that folder instead of cloning another copy and confirm that you are on the intended branch.

The relevant folders are:

```text
CSI5324-IndieDevs/
  backend/         Spring Boot application, Maven wrapper, and JUnit tests
  frontend/        Next.js application and browser regression scripts
  Documentation/   Project documentation and diagrams
```

Commands below assume the repository's root folder is `CSI5324-IndieDevs`. Run npm commands inside **frontend**, and Maven commands inside **backend**.

## 3. Start the backend - Terminal 1

Open a terminal in the repository root.

**Windows PowerShell:**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**macOS / Linux:**

```bash
cd backend
./mvnw spring-boot:run
```

The first startup can take several minutes while Maven downloads dependencies. Wait until the log reports that Tomcat started on port **8080** and `BackendApplication` started. Leave this terminal running.

Confirm the backend is available by opening:

[http://localhost:8080/api/artists](http://localhost:8080/api/artists)

You should see a JSON list of the seeded artists. The backend's root URL is not a frontend page; use `/api/artists` for this check.

## 4. Install and start the frontend - Terminal 2

Open a **second terminal** in the repository root:

```text
cd frontend
npm ci
npm run dev
```

`npm ci` installs the dependency versions recorded in `frontend/package-lock.json`. You only need to reinstall after cloning, changing dependencies, or removing `node_modules`.

Wait for Next.js to report that it is ready, then open:

[http://localhost:3000](http://localhost:3000)

Keep both terminals running: the frontend uses port **3000** and calls the backend on port **8080**. Use `localhost:3000` for this walkthrough, since the backend's current CORS settings allow that frontend origin.

To stop either process, press **Ctrl+C** in its terminal.

### Optional: run the frontend as a production build

Stop the frontend development server in Terminal 2, then run these commands from `frontend`:

```text
npm run build
npm run start
```

Open the same `http://localhost:3000` URL and keep the backend running. `npm run start` requires a successful build first.

## 5. Explore the demo accounts

The app opens on **Discover**, where you can search by artist name, genre/style, and location. Select the account button directly under the ArtistConnect logo to switch among the original demo personas. No password is required for this local demo.

| Demo persona | Role | Main screens to explore |
| --- | --- | --- |
| Nicholas Nolen | Fan | Discover, For You, Following, My profile, Report content |
| Jordan Smith | Fan | The second fan's independent following/profile data and recommendations |
| William Waweru | Artist | Discover, Make a post, Manage Events |
| Admin Alex | Administrator | Ban Appeals, Artist Directory, Verifications, Report queue |
| Admin Garrett | Administrator | The second appeal-reviewer perspective and administrator screens |

The current project uses persona switching and the `X-User-Id` request header rather than session-based login. The frontend maps personas to the backend accounts; the older appeal workflow retains its separate reviewer IDs.

### Sample data and persistence

- The backend creates the H2 schema and loads `backend/src/main/resources/data.sql` automatically.
- Backend-backed follows, fan profiles, and reports survive browser reloads while the backend is running.
- **Restarting the backend resets its in-memory database to the sample data.** Spring Boot DevTools restarts can also reset it during development.
- Some existing demo features, including the post composer and chat/booking previews, use browser local storage. Restarting the backend does not clear that browser data.
- Before a presentation or a browser test that expects the original samples, restart the backend and refresh the frontend. Avoid changing the seed records immediately before running those tests.

For database inspection, the optional [H2 console](http://localhost:8080/h2-console) uses:

| Setting | Value |
| --- | --- |
| Driver class | `org.h2.Driver` |
| JDBC URL | `jdbc:h2:mem:testdb` |
| User name | `sa` |
| Password | Leave blank |

## 6. Run the backend tests

The JUnit tests start their own Spring Boot test context and H2 database. You do not need either application server running to execute them.

Open a terminal in the repository root.

**Windows PowerShell:**

```powershell
cd backend
.\mvnw.cmd test
```

**macOS / Linux:**

```bash
cd backend
./mvnw test
```

A successful run ends with **BUILD SUCCESS** and zero test failures/errors. Detailed test reports are written to `backend/target/surefire-reports/`.

The tests cover artist search, event creation/update, moderation and appeals, recommendations, report review, and the fan-community use cases. Fan-community tests include duplicate/concurrent follows and reports, authorization, profile privacy and image validation, stale edits, database-write rollback, and reporting deleted content using retained evidence.

To run only the fan-community test class, use this command from `backend`:

```powershell
.\mvnw.cmd "-Dtest=FanCommunityTest" test
```

On macOS/Linux, replace `.\mvnw.cmd` with `./mvnw`.

## 7. Check the frontend

From the repository root, open a separate terminal and run:

```text
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

These check lint rules, TypeScript types, and the production build. The frontend does not currently define an `npm test` command or a separate frontend unit-test runner. Browser integration tests are provided in the next section.

Lint currently reports two existing hook-dependency warnings in `page.tsx`; distinguish warnings from errors when reviewing the output. Next.js may also warn about multiple lockfiles in the repository.

## 8. Run the browser integration tests

These optional tests drive a headless browser against the **running** frontend and backend. Complete Sections 3 and 4 first, keeping the servers on `localhost:8080` and `localhost:3000`.

### Install the browser test tools

In a third terminal, from the repository root:

```text
cd frontend
npm install --no-save --package-lock=false playwright
npx playwright install chromium
```

This installs Playwright for your local test run without changing the project's package manifest or lockfile. A later `npm ci` removes this extra package, so reinstall it if needed.

On Linux, Chromium may require system libraries. If the browser cannot launch because of missing libraries, install them with:

```bash
npx playwright install --with-deps chromium
```

The system-library installation may request administrator privileges.

### Presentation regression test

Start with a freshly restarted backend and run from `frontend`:

```text
node tests/presentation-regression.cjs
```

This verifies the five original demo personas, the visible account switcher, initial search, live fan/artist search, recommendations, event-edit and post-composer screens, appeals, artist moderation, verifications, the new fan/admin tabs, and desktop/mobile navigation. It navigates the existing backend data without changing its records.

### Fan-community integration test

Restart the backend again to restore its original sample records, then run from `frontend`:

```text
node tests/fan-community-smoke.cjs
```

This verifies persisted follows, account isolation, profile editing/privacy/validation, report submission and duplicate protection, administrator resolution, mobile layout, and browser runtime errors.

**This test changes the local demo data:** it edits a fan profile, changes a follow relationship, and creates/resolves a report. Restart the backend after the test if you want the original data for a presentation. The scripts expect the original seeded records; previously resolved applications, removed content, or existing pending test reports can cause failures unrelated to startup.

Both scripts print a **PASS** message when successful and return a nonzero exit code on failure. Screenshots are saved under `frontend/test-results/`.

### Optional test configuration

The scripts work with their defaults after the steps above. Advanced overrides are:

| Environment variable | Purpose / default |
| --- | --- |
| `PLAYWRIGHT_MODULE` | Path/name of an existing Playwright installation; defaults to `playwright`. |
| `BROWSER_EXECUTABLE` | Path to an existing compatible Chromium browser, if using one instead of Playwright's downloaded Chromium. |
| `WEB_URL` | Frontend address; defaults to `http://localhost:3000`. |
| `API_URL` | Backend address for the fan-community script; defaults to `http://localhost:8080`. |

If changing addresses, keep the frontend API configuration and backend CORS settings consistent as well.

## 9. Common setup problems

| Problem | What to check |
| --- | --- |
| `java` or `javac` is not recognized, or Maven cannot find Java | Install JDK 21, set `JAVA_HOME` to the JDK folder, add its `bin` folder to `PATH`, and reopen the terminal. Verify both Java version commands. |
| Java compilation reports an unsupported release | The active JDK is older than the Java 21 target. Check `java -version`, `javac -version`, and `JAVA_HOME`. |
| PowerShell blocks `npm.ps1` or `npx.ps1` | Use `npm.cmd` or `npx.cmd` in place of `npm` or `npx`; for example, `npm.cmd ci` and `npm.cmd run dev`. |
| `./mvnw` reports permission denied on macOS/Linux | From `backend`, run `chmod +x mvnw`, then retry `./mvnw spring-boot:run` or `./mvnw test`. |
| Maven/npm cannot download dependencies | Check your network/proxy access. Maven needs Maven Central and the Spring snapshot repository; npm needs access to its package registry. |
| Port 8080 or 3000 is already in use | Stop the existing server with Ctrl+C in its terminal, or close the other application using that port. Keep these default ports for the walkthrough and browser tests. |
| The UI loads but live features fail | Confirm the backend is still running and `/api/artists` returns JSON. Open the frontend using `http://localhost:3000`, not a different hostname or port. |
| The frontend needs a different backend address | Create `frontend/.env.local` containing `NEXT_PUBLIC_API_URL=http://localhost:8080`, replacing the URL with your backend address. Restart the dev server; rebuild if using a production build. No environment file is needed for the default setup. |
| Playwright says its browser executable is missing | From `frontend`, run `npx playwright install chromium`. |
| Playwright cannot find its module | Re-run the optional local Playwright installation after `npm ci`, or set `PLAYWRIGHT_MODULE` to an existing installation. |
| Browser tests fail after a demo session | Restart the backend to restore sample data, wait for startup to complete, and retry the scripts with the frontend running. |
| Backend changes disappeared after restarting | This is expected with the current in-memory H2 configuration. Use the seeded data for repeatable local demonstrations. |
