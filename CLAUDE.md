@AGENTS.md

# Carsharing Platform — Project Rules

## Project Overview
A production-ready carsharing platform for Central Asia.
- **Web:** Next.js (App Router)
- **Mobile:** React Native
- **Backend:** Node.js + Express + PostgreSQL
- **State Management:** Redux Toolkit (RTK) + RTK Query

---

## Agent Mindset
- You are a **senior engineer**. Apply Redux best practices: Slices, Selectors, RTK Query for all API calls.
- Do NOT use `useState` for data that belongs in global state.
- Think through the Redux state tree **before** creating any slice.

---

## Project File Structure (Frontend & Mobile)

```
store/
  index.js              ← central store config
  slices/               ← domain slices (authSlice.js, carSlice.js, …)
  apis/                 ← RTK Query services (carApi.js, userApi.js, …)
hooks/
  redux.js              ← typed useDispatch and useSelector wrappers
```

---

## Redux & RTK Query Rules

- **Immutability:** Always use `createSlice` (Immer under the hood) for state updates. Never mutate state directly.
- **Data fetching:** Use **RTK Query** for all server-side data. Do NOT use `createAsyncThunk` for API calls — only for non-API async logic.
- **Selectors:** Use `createSelector` for any computed/derived data to prevent unnecessary re-renders.
- **Encapsulation:** Keep Redux logic out of UI components. Wrap selectors and dispatch in custom hooks.
- **Workflow order:** Define Slice + API endpoint → build Redux logic → build UI component.

---

## Backend Rules

- Use **ES Modules**, `async/await`, and **Zod** for all input validation.
- **Forbidden:** `SELECT *` — always select only the columns you need.
- Use **parameterized queries** at all times to prevent SQL injection.
- API response shapes must match what the RTK Query endpoints expect.
- All database timestamps must be **UTC**.

---

## Mobile (React Native) Rules

- Wrap the root component in `App.js` with Redux `<Provider>`.
- Use **redux-persist** + `AsyncStorage` to persist the JWT session on device.
- Avoid high-frequency store updates in heavy list views (e.g., Car Map).

---

## Security & Localization

- Auth: **JWT with refresh token rotation**. Store tokens securely (never in localStorage on web).
- Support **Russian** and local Central Asian languages.
- All DB timestamps must be **UTC**.

---

## Forbidden Actions

- NEVER use `any` types in TypeScript.
- NEVER use inline styles — use **Tailwind CSS** on web, **StyleSheet** on mobile.
- NEVER put business logic inside controllers or UI components.
- NEVER fetch data directly inside a component — always use RTK Query generated hooks.

---

## After Every Task

List the new Redux actions, selectors, and RTK Query endpoints that were created or modified.
