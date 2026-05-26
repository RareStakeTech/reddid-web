# Contributing to ReddID Next

Thank you for your interest in contributing. This document explains how to contribute code, add platforms, and follow the project's conventions.

---

## Before you start

- Check the [roadmap](docs/ROADMAP.md) to see what's planned vs already in progress.
- Open an issue to discuss large changes before investing time in a PR.
- All contributors are expected to read and follow the [security policy](SECURITY.md).

---

## Development setup

```bash
git clone https://github.com/RareStakeTech/reddid-web.git
cd reddid-web
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.  
Data is persisted to `data/db.json` (auto-created on first registration, gitignored).

### Environment variables

No `.env` is required for local development. Optional overrides:

| Variable | Default | Description |
|----------|---------|-------------|
| `REDDID_DB_PATH` | `data/db.json` | Override the data file location |
| `REDDID_BLOCKBOOK_URL` | `https://blockbook.reddcoin.com` | Blockbook API base for balance/txns |
| `NODE_ENV` | `development` | Set to `production` for Railway deploys |

---

## Code style

- **TypeScript everywhere** — no untyped JS in `src/`.
- **`'use client'` only when needed** — prefer Server Components; add the directive only when you use hooks, event handlers, or browser APIs.
- **No `any`** — use `unknown` and narrow, or open a type discussion.
- **Inline styles** — the project uses inline React styles (no CSS modules, no Tailwind). Keep this consistent.
- **Lucide React icons** — use `lucide-react` for all icons. No icon fonts, no inline SVG sprites.
- **Font convention**: `'Rubik'` for headings and UI labels, `'Roboto'` for body text, monospace for addresses/codes.
- **ESLint** — run `npm run lint` before committing. Zero warnings and zero errors are required (`_`-prefixed variables suppress unused-var warnings where intentional).

---

## Changelog requirement

**Every PR that touches `src/` or `public/` must add a `CHANGELOG.md` entry** under `[Unreleased]` before the PR is merged.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/):

```markdown
## [Unreleased]

### Added
- Short description of new feature or file (component name, route, why it matters)

### Changed
- What was modified and why

### Fixed
- Bug description, root cause, fix approach
```

Entries that land in a release are moved to a versioned section (e.g. `## [0.4.7] — 2026-05-25`) by the maintainer.

---

## Adding a platform

All platform definitions live in **`src/lib/platforms.ts`**. This is the single source of truth used by the register page, explore filters, tip page badges, OG image generator, and the Love Button extension.

To add a new platform:

1. **Add a `PlatformDef` entry** to the `PLATFORM_REGISTRY` array in `platforms.ts`:

```ts
{
  id: 'bluesky',                       // machine ID — matches socialProofs[].platform
  name: 'Bluesky',                     // human display name
  icon: '🦋',                          // unicode badge (no external images)
  color: '#0085ff',                    // brand color
  status: 'live',                      // 'live' | 'beta' | 'planned'
  profileUrl: u => `https://bsky.app/profile/${u}`,
  description: 'Decentralised social by Bluesky PBC.',
  category: 'social',
},
```

2. **Verify it appears** in the register page platform selector, the explore filter dropdown, and the `/platforms` support matrix.

3. **Add a content script** to the Love Button extension (`love-button/content/`) if the platform should show the tip button inline. See `docs/PLUGINS.md` for the content-script API.

4. **Update CHANGELOG.md** (see above).

5. **Open a PR** with all four changes together.

---

## Opening a pull request

1. Fork the repo and create a branch from `master`: `git checkout -b feat/my-change`.
2. Make your changes. Run `npm run lint` and `npx tsc --noEmit`.
3. Add or update tests if the change is testable (vitest suite planned for v0.5).
4. Update `CHANGELOG.md`.
5. Push and open a PR against `master`. Fill in the PR description with what changed and why.

PRs that fail CI (type-check, build, lint) will not be reviewed until they pass.

---

## Commit message format

We use conventional commit prefixes:

| Prefix | Use for |
|--------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructure with no behaviour change |
| `chore` | Build scripts, CI, dependencies |
| `perf` | Performance improvement |

Example: `feat(search): add /search?q= page with debounced live results`

---

## Questions

Open a GitHub Discussion or email [rarestaketech@gmail.com](mailto:rarestaketech@gmail.com).
