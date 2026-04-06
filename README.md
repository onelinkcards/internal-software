# OneLink internal billing (offline / team tool)

This folder is **intentionally separate** from `Onelink.cards-main-website`. It is **not** part of the public site deploy.

- Use these files as the **spec + prompt** to build a small internal app (or hand to a developer).
- **Do not** commit API keys or customer PII here.
- If you use Git for this tool, create a **new private repository** — do not mix with the marketing site repo unless you explicitly want a monorepo.

## Contents

| File | Purpose |
|------|---------|
| `company.json` | Legal entity + GST + address (seller on invoice) |
| `plans-reference.json` | OneLink plan catalogue snapshot (sync with `site.ts` when prices change) |
| `BILLING_SOFTWARE_SPEC.md` | What to build, GST rules, PDF, UX |
| `CURSOR_IMPLEMENTATION_PROMPT.md` | Copy-paste prompt for Cursor / another AI to implement the app |

## Run the app (Vite)

```bash
cd internal-software
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`). Use **Print / Save as PDF** in the browser.

Optional: add your logo as **`public/onelink-logo.png`**.

```bash
npm run build   # production bundle in dist/
```

## Quick start (after you scaffold an app)

1. Config is loaded from `company.json` + `plans-reference.json` in this folder (imported by the app).
2. Behaviour matches `BILLING_SOFTWARE_SPEC.md`.
3. **PDF:** Print dialog → Save as PDF (v1).
