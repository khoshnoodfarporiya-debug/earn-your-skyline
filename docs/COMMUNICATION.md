# Communication — handoff between AI assistants

This file is how AI assistants working on this project talk to each other. It
is for Claude, ChatGPT, Codex, Cursor, Copilot, Gemini, or anything else
the owner brings in.

**If you are an AI starting work here, read this whole file before you change
anything.** Then read [`WORKING_PLAN.md`](WORKING_PLAN.md) for the to-do list.
When you finish a session, add an entry to the [session log](#session-log) at
the bottom, so the next assistant knows what you did and what you left.

The repository is **public**. Never write personal details (names, emails,
anything private about the owner) into this file, a commit, or a pull request.

---

## 1. What this project is

**Earn Your Skyline** is a turn-based career management game that runs in the
browser. One turn is one week. Each career runs on its own rules rather than
one shared economy with different names:

| Career (code id) | What makes it hard |
| --- | --- |
| Physician (`doctor`) | Capability: you can't treat what you have no department for. The most complete career |
| Chef (`chef`) | Spoilage: stock decays and is served oldest first |
| Solicitor (`lawyer`) | The case pipeline: nothing pays until a case settles, and it might not |
| Founder (`founder`) | Runway: everything is priced in weeks of survival |
| Politician (`politician`) | The electoral cycle: support decays and is only banked on polling day |
| Architect (`architect`) | The long commission: payment is staged against milestones you don't control |
| Engineer (`engineer`) | Defect risk: faults surface weeks after you ship |

There is no forced game over. Failure produces setbacks with recovery routes.
The long [`README.md`](../README.md) holds the full design notes.

**Stack:** Next.js 16 (Turbopack), React 19, TypeScript, Tailwind 3,
Playwright for browser tests. There's no backend; saves live in the browser.

---

## 2. Rules for working here

1. **This is a newer Next.js than you were trained on.** Before writing
   Next-specific code, read the relevant guide in `node_modules/next/dist/docs/`
   (see [`AGENTS.md`](../AGENTS.md)).
2. **The game engine is deterministic.** Never use `Math.random()` or the clock in
   game logic. Use the seeded generator from `lib/game/rng.ts`. When something
   needs its own randomness, give it a *derived stream*, as the Politician's
   postbag and polling-day mood do:
   `makeRng((s.seed ^ (s.week * SOME_CONSTANT)) >>> 0)`. That stops a new
   feature from changing every other roll in the game.
3. **Old saves must keep loading.** New state fields are optional
   (`field?: Type`), and each career's `validateData` must accept their absence
   and reject bad values. Add a check for both.
4. **Every behaviour change gets an engine check** in `scripts/commands.ts`.
   It is a big file of `check("what should be true", condition, detail)` calls.
   Name the check as a plain sentence about the rule.
5. **Game text is written in British English** in a dry, plain voice ("organise",
   "colour", "a week nobody sees you"). Match it.
6. **Images are atmosphere, never information.** Numbers and status always live
   in real HTML beside or on top of a picture. No text inside images. See
   [`VISUALS.md`](VISUALS.md).
7. **Accessibility is a requirement:** WCAG AA contrast, visible focus,
   decorative images get `alt=""`, and layouts must work from 375px wide.
8. **Don't commit, push, merge or change git settings unless the owner asks.**
   Work on a branch, never directly on `main`.

---

## 3. Where things are

| Path | What it holds |
| --- | --- |
| `lib/game/engine.ts` | `startRun`, `advanceWeek`, `runCommand`: the turn loop every career shares |
| `lib/game/careers/<career>.ts` | One `CareerDef` per career: resources, actions, commands, `resolveWeek`, `objective`, `validateData` |
| `lib/game/careers/constituency.ts`, `startup.ts`, `studio.ts`, `workshop.ts`, `kitchen.ts`… | Each career's model, kept apart from the engine contract |
| `lib/game/save.ts` | Saving, loading and validation |
| `lib/ui/` | Registries the interface reads: navigation, help text, and image registries (`visuals.ts`, `careerSceneArt.ts`, `purchaseArt.ts`, `portraits.ts`) |
| `components/` | React screens. `components/careers/<Career>Screens.tsx` per career |
| `scripts/commands.ts` | The engine checks (`npm run check`), about 2,000 of them |
| `scripts/cities.ts` | The balance harness: bots play each career in each city |
| `scripts/build-purchase-art.ts` | Turns PNG masters into the WebP files the game serves (`npm run build:art`) |
| `e2e/` | Playwright browser tests and fixtures |
| `art-source/` | PNG masters (stored with Git LFS). Never served directly |
| `public/visuals/` | The WebP files the game actually loads |
| `docs/` | This file, the working plan, the image prompts, the asset manifest |

---

## 4. Commands, and what "done" means

| Command | What it does |
| --- | --- |
| `npm run dev` | The game at http://localhost:3500 |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run check` | The engine checks |
| `npm run build` | Production build |
| `npm run e2e` | Playwright browser tests (mobile and desktop) |
| `npx tsx scripts/cities.ts 40 politician` | Balance harness: 40 seeds, one career (drop the career name to run all) |
| `npm run build:art` | Convert new PNG masters to WebP |

A change is done when the type check, lint, engine checks and build all pass,
and when the balance harness still holds every contract for the career you
touched. Run the browser tests when you change a screen.

**CI** (`.github/workflows/ci.yml`) has two jobs:
- **`verify`** runs the type check, lint, engine checks, build and the full
  browser suite. It must pass.
- **`balance`** runs `scripts/cities.ts 12`. It is **non-blocking on purpose**,
  and it is currently red because of the ambitious Chef (10 contract
  violations). That's a known open item. Don't "fix" CI by hiding it.

---

## 5. Traps on the owner's machine (Windows)

- **Node isn't on the Bash `PATH`.** It is at `C:\Program Files\nodejs`. In
  PowerShell, prefix commands with
  `$env:Path = "C:\Program Files\nodejs;$env:Path";`. Python isn't installed.
- **Line endings:** `core.autocrlf=true`. `scripts/commands.ts` is stored
  with CRLF line endings in git, so a normal `git add` turns it into a
  whole-file diff. Stage it with `git -c core.autocrlf=false add scripts/commands.ts`
  and confirm with `git diff --cached --stat` that only your lines changed.
- **The browser tests hang on Windows after passing.** Playwright workers
  don't shut down, the run takes about 12 minutes, and it exits with code 1
  even when every test passed. Read the `N passed` line, not the exit code.
- **Git has no global name or email set.** Commits so far used the
  identity of the repository's earlier commits, passed per command with `-c`.
  Don't set global git config without asking.
- **The project lives in a OneDrive folder.** Expect occasional file locks.
- **Art masters are in Git LFS.** If PNGs show up as tiny text files, run
  `git lfs pull`.

---

## 6. Where the work stands (25 Nov 2026)

- **`main`** has the codebase review, `WORKING_PLAN.md`, and the Politician
  fix where you only climb a rung by winning an election
  ([PR 3](https://github.com/khoshnoodfarporiya-debug/earn-your-skyline/pull/3), merged).
- **[PR 4](https://github.com/khoshnoodfarporiya-debug/earn-your-skyline/pull/4)**,
  branch `balance/politician-can-lose`, is **open** and green apart from the
  known Chef balance check. It makes elections losable:
  - a 10-point ceiling on campaign lifts above the lean
  - a casework record cap of 4
  - 5 points of "time for a change" per election won
  - steeper bars per rung
  - a ±8-point polling-day mood swing

  Even seats now win 75–88% of runs, Milan 95–98%, Lagos 8–13%.
- **This branch** (`docs/handoff-and-visuals`) adds this file and
  [`VISUALS.md`](VISUALS.md).

### Balance snapshot

| Career | Bots reach the objective | Note |
| --- | --- | --- |
| Chef (plain) | 0% | Ends below zero net worth everywhere |
| Chef (ambitious) | 0% | Breaks its contract in 7 cities; the reason CI `balance` is red |
| Solicitor | 0% | 12–28% progress |
| Founder | Berlin 100%, elsewhere 0% | Unexplained gap between cities |
| Politician | 75–98%, Lagos about 10% | After PR 4 |
| Architect (decisive) | 15–100% | The healthiest |
| Engineer | 0% | 40–76% progress |

### What to pick up next

In priority order (details in [`WORKING_PLAN.md`](WORKING_PLAN.md)):
1. Rebalance the Chef until the plain kitchen doesn't end below zero, and bring
   the ambitious Chef inside its contract. That turns CI fully green.
2. Give the Solicitor and Engineer bots a strategy that reaches the objective
   somewhere.
3. Explain the Founder's Berlin-vs-everywhere-else gap.
4. Fix the victory screen, which shows the Physician's hospital for every
   career. The images are specified in [`VISUALS.md`](VISUALS.md), batch 1.
5. Human playtests: one full run per career, with notes.

---

## 7. How to hand off

At the end of a session, add an entry below with:
- the date and which assistant you are
- the branch you worked on, and any PR
- what changed, in plain words
- what you verified, and what you didn't
- what is left, and anything the next assistant must not undo

Keep entries short. Newest at the bottom. Move finished to-do items in
`WORKING_PLAN.md` rather than repeating them here.

---

## Session log

### 23 Nov 2026 — Claude (Claude Code)
- Cloned the repository and wrote a review: about 7.5/10. Strong engineering
  and design; the weak spots were balance, depth and readiness to ship.
- Created `docs/WORKING_PLAN.md`.
- Traced the Politician's "33% wall": being selected gave you the office
  instantly, and selections chained.
- Fixed it so office comes only from winning, one rung per election.
- Merged as PR 3.

### 23–25 Nov 2026 — Claude (Claude Code)
- Made Politician elections losable (PR 4, open). Measured first: positions
  plus the record beat every bar by 9–25 points, and nothing on polling day was
  random.
- Added 5 engine checks. The type check, lint, 2,078 checks and the build pass.
- CI `verify` (including the browser suite) passes.
- **Open:** positions still stack for free. All five best-weighted stances are
  worth about +17 points against the bots' +9. Watch for it in playtests.

### 25 Nov 2026 — Claude (Claude Code)
- Wrote this file and `docs/VISUALS.md`, which holds image prompts for an image
  model.
- Linked this file from `AGENTS.md` so other assistants find it automatically.
- Found that the victory screen uses the Physician's hospital art for every
  career. Images for the fix are prompt batch 1. The code change, choosing
  the image by career in `components/Outcome.tsx`, isn't done yet.
