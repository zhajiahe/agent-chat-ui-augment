## Agent Guide: Understanding and Modifying This Project

This repository is a Next.js 15 app that provides a chat UI for any LangGraph server with a `messages` key. It is configured for private deployment via an internal API proxy, keeping the real LangGraph URL and secrets server-side.

### Code Refactor Guide
- always update this file(AGENTS.md) when code changed.

### Quick Facts
- **Framework**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI, Sonner
- **LLM/Graph SDK**: `@langchain/langgraph-sdk` and `@langchain/langgraph-sdk/react`
- **Server proxy**: `langgraph-nextjs-api-passthrough` via `src/app/api/[..._path]/route.ts`
- **Start dev**: `pnpm dev` → http://localhost:3000
- **Start prod**: `pnpm build && pnpm start`

### Primary Entry Points
- `src/app/page.tsx`: Renders the chat experience. Wraps the UI in `ThreadProvider` and `StreamProvider`.
- `src/components/thread/index.tsx` (`Thread`): Main chat component (input, message rendering, submission).
- `src/app/api/[..._path]/route.ts`: Edge runtime proxy to LangGraph server (hides real server URL; injects API key if provided).

### Environment & Configuration
Server-side environment (kept private):
- `LANGGRAPH_API_URL`: The LangGraph server URL used by the proxy.
- `LANGSMITH_API_KEY`: Optional; injected by the proxy when calling a deployed LangGraph server.

Client-facing (non-secret):
- `NEXT_PUBLIC_ASSISTANT_ID`: Default assistant/graph id; can be overridden via query param `?assistantId=`.

Server-side only (private):
- `BACKEND_API_URL`: Backend API base (for login/register/data sources/memories). All client calls go through the internal proxy at `/backend` to keep this private.

Local example can be found in `env.example`.

The app always communicates with the internal proxy at `/api`. Do not surface `NEXT_PUBLIC_API_URL` in private mode.

### Core Architecture
Providers wire the app to the LangGraph SDK and thread management:
- `src/providers/Stream.tsx`
  - Uses `useStream` from `@langchain/langgraph-sdk/react` to create a live streaming session.
  - Fixes `apiUrl` to the internal proxy: `window.location.origin + "/api"`.
  - Determines `assistantId` from URL or `NEXT_PUBLIC_ASSISTANT_ID`.
  - Emits UI updates via `onCustomEvent` integrating with `react-ui` reducers.
  - Performs `/api/info` health check and toasts on failure.

- `src/providers/Thread.tsx`
  - Fetches and manages threads for the current `assistantId` (graph id or assistant id).
  - Uses `createClient(apiUrl, apiKey)` from `src/providers/client.ts` which wraps `@langchain/langgraph-sdk`.
  - Searches threads with metadata `{ graph_id }` or `{ assistant_id }` depending on whether `assistantId` is a UUID.

UI and behavior:
- `src/components/thread/index.tsx`
  - Collects user input and optional content blocks.
  - Builds a submission payload `{ messages, context }`. Model/provider/database selection is handled server-side;
  - Calls `stream.submit(...)` to invoke the graph via the proxy.
  - Displays thread messages and artifacts (see `artifact.tsx`).

- `src/components/settings/settings-dialog.tsx`
  - Lets users adjust `db_name` via query state.
  - If logged in (AuthProvider), can manage backend resources:
    - View/create/update/delete data sources.
    - View/create/update/delete memories for the selected data source.
  - Auto-selects the first data source after refresh to keep memories in sync.
  - Shows that API routing is through the internal proxy and that the real URL is server-configured.

Server proxy:
- `src/app/api/[..._path]/route.ts`
  - Initializes `initApiPassthrough({ apiUrl: process.env.LANGGRAPH_API_URL, apiKey: process.env.LANGSMITH_API_KEY, runtime: "edge" })`.
  - Logs configuration state server-side without leaking secrets.

### Data Flow
1. User types a message in `Thread` and submits.
2. `Thread` composes `messages` and optional `context` only. The server decides model/provider/database configuration.
3. `useStream` sends the request to `/api` with `assistantId` and optional `threadId`.
4. The API proxy forwards the request to `LANGGRAPH_API_URL`, injecting `LANGSMITH_API_KEY` if set.
5. Streamed updates return to the client, rendered via `react-ui` reducers; artifacts can open in a side panel.

### Key Files to Inspect
- `src/app/page.tsx` — app composition
- `src/providers/Stream.tsx` — streaming session and health check
- `src/providers/Thread.tsx` — thread search and state
- `src/components/thread/index.tsx` — chat logic and submit path
  - Hides the top-right user/data source indicator; submission context still carries `user_name` and `db_name`.
- `src/components/thread/messages/*` — message renderers
- `src/components/thread/artifact.tsx` — artifact panel
- `src/components/settings/settings-dialog.tsx` — adjustable settings
- `src/lib/backend-client.ts` — backend API client (auth/data sources/memories)
- `src/providers/Auth.tsx` — auth state (login/register/logout)
- `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx` — auth pages
- `src/app/Header.tsx` — removed from layout; header shows title only if used
- `src/components/BottomLeftControls.tsx` — settings + user menu fixed at bottom-left
- `src/app/api/[..._path]/route.ts` — proxy to LangGraph server
- `src/app/backend/[...path]/route.ts` — proxy to backend API (`BACKEND_API_URL`)

### Authentication & Access Control
- The main chat page (`src/app/page.tsx`) is guarded: unauthenticated users are redirected to `/auth`.
- Settings and username are shown at the bottom-left via `BottomLeftControls` when logged in; the dropdown includes logout.
- If the user is already logged in, `/auth` and `/auth/login` auto-redirect to `/`.

### How To Modify or Extend
- Change assistant/graph defaults: set `NEXT_PUBLIC_ASSISTANT_ID` or pass `?assistantId=`.
- Model/provider/database configuration is server-side only; adjust it on your LangGraph server or proxy.
- Add headers/tokens server-side: extend `initApiPassthrough` in `route.ts` with `defaultHeaders` or custom logic.
- Add client headers: pass `defaultHeaders` via `useStream` setup in `Stream.tsx` if your server requires them.
- Customize message rendering: edit `src/components/thread/messages/ai.tsx` and `human.tsx`.
- Add new UI tools/artifacts: see `artifact.tsx` and the `useArtifact` pattern in README.

### Expected LangGraph Contract
The UI expects a LangGraph endpoint compatible with `@langchain/langgraph-sdk` that:
- Accepts `messages` and optional `config` under `configurable`.
- Supports thread creation and retrieval via the SDK.
- Streams token and UI events compatible with `@langchain/langgraph-sdk/react-ui`.

### Local Development
1. Install deps: `pnpm install`
2. Ensure environment variables are set (see `env.example`).
3. Run: `pnpm dev` → open http://localhost:3000

### Process Management (PM2 + Makefile)
- PM2 ecosystem file: `ecosystem.config.cjs` (app name: `agent-chat-ui`).
- Makefile targets:
  - `make install` — install dependencies
  - `make build` — Next.js production build
  - `make start` — start with PM2 (uses `PORT` env var; default 3000)
  - `make stop` — stop and delete PM2 app
  - `make restart` — restart PM2 app (or start if not running)
  - `make status` — show PM2 status
  - `make logs` — tail PM2 logs
  - `make dev` — run the local dev server

Example:
```bash
make build
PORT=3000 make start
make logs
```

### Production Notes
- Keep `LANGGRAPH_API_URL` and `LANGSMITH_API_KEY` server-side only.
- All client requests go through `/api` (edge runtime proxy).
- Do not expose direct LangGraph endpoints to the browser in private deployment.

### Security Features
- **Database Security**: Database URL construction moved to server-side to prevent credential exposure
- **CORS Protection**: Environment-based CORS configuration with security headers (HSTS, CSP, etc.)
- **Rate Limiting**: API rate limiting with different limits for auth, database, and general endpoints
- **Error Handling**: Standardized error handling with detailed logging and user-friendly messages
- **Input Validation**: Comprehensive input validation and sanitization

### Troubleshooting
- Connection failures: verify `/api/info` reachable, `LANGGRAPH_API_URL` is correct, and API key requirements on your LangGraph deployment.
- No threads showing: ensure `assistantId` matches your graph or assistant; confirm SDK connectivity in `ThreadProvider.getThreads`.
- Message not rendering: ensure returned events and `messages` conform to SDK expectations; check `ai.tsx` and reducers in `Stream.tsx`.
- Login API format errors: The backend API expects `application/x-www-form-urlencoded` format for login requests, not JSON. The `backend-client.ts` handles this automatically with `isFormUrlEncoded: true` flag.
- Backend API proxy: All backend API calls go through `/backend` proxy to `BACKEND_API_URL`. Ensure the backend server is running and accessible.


