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
9. **Write everything down, in the same change.** This is the owner's standing
   rule (25 Nov 2026). Whatever you do (a fix, an investigation, a balance
   change, a dead end), record it here before you finish:
   - update section 6, "Where the work stands"
   - add a session-log entry: what you found, the numbers, what you verified,
     what you didn't, and what is left
   - tick or add the item in [`WORKING_PLAN.md`](WORKING_PLAN.md)

   Commit the write-up with the work itself, not later. Other assistants (and
   the owner) rely on it to see what happened without redoing it.

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
- **Line endings:** `core.autocrlf=true`. Some files are stored with CRLF
  line endings in git: at least `scripts/commands.ts` and
  `lib/game/careers/chef.ts`. A normal `git add` turns them into a whole-file
  diff. Stage them with `git -c core.autocrlf=false add <file>`, keeping the
  file's CRLF endings. Then confirm with `git diff --cached --stat` that only
  your lines changed, and do that before every commit, for every file.
- **The browser tests hang on Windows after passing.** Playwright workers
  don't shut down, the run takes about 12 minutes, and it exits with code 1
  even when every test passed. Read the `N passed` line, not the exit code.
- **Don't switch branches while the browser suite runs.** It serves the live
  working tree, so a checkout mid-run tests the wrong code.
- **Git has no global name or email set.** Commits so far used the
  identity of the repository's earlier commits, passed per command with `-c`.
  Don't set global git config without asking.
- **The project lives in a OneDrive folder.** Expect occasional file locks.
- **Art masters are in Git LFS.** If PNGs show up as tiny text files, run
  `git lfs pull`.

---

## 6. Where the work stands (26 Nov 2026)

- All 24 PNG masters from the three written batches in [`VISUALS.md`](VISUALS.md)
  are in `art-source/visuals/`: six career milestone scenes, two screen
  banners and sixteen event illustrations. Runtime conversion and wiring are
  open. The current end screen shows on retirement, so choose the milestone
  artwork's display trigger before wiring batch 1.

- **`main`** has the codebase review, `WORKING_PLAN.md`, and the Politician
  fix where you only climb a rung by winning an election
  ([PR 3](https://github.com/khoshnoodfarporiya-debug/earn-your-skyline/pull/3), merged).
- **[PR 4](https://github.com/khoshnoodfarporiya-debug/earn-your-skyline/pull/4)**
  (merged) makes elections losable:
  - a 10-point ceiling on campaign lifts above the lean
  - a casework record cap of 4
  - 5 points of "time for a change" per election won
  - steeper bars per rung
  - a ±8-point polling-day mood swing

  Even seats now win 75–88% of runs, Milan 95–98%, Lagos 8–13%.
- **[PR 5](https://github.com/khoshnoodfarporiya-debug/earn-your-skyline/pull/5)**
  (merged) added this file and [`VISUALS.md`](VISUALS.md).
- **The Chef rebalance** (branch `balance/chef-rebalance`, not merged yet). See
  the session log for the full investigation. In short:
  - **Trade credit.** Suppliers deliver on account down to `creditLine`
    (`TRADE_CREDIT` = 4,000 Lyon money, scaled per city). Past that line, the
    covered market still sells plain crates, but only enough for the chef to
    cook alone.
  - **Unpaid payroll.** A week that ends past the credit line loses the last
    cook hired.
  - **Salaries cut 30%** in `KITCHEN_ROLES`.
  - **Mumbai food** 0.52 → 0.46.
  - **The harness's Chef bots** use local-money thresholds.
  - **Every balance contract in the suite now holds**, so CI `balance` should be
    green.

### Balance snapshot

| Career | Bots reach the objective | Note |
| --- | --- | --- |
| Chef (plain) | 0% | The control: never repays its loan by design. Cash stays positive. Net worth is negative only by the unpaid loan in four cities |
| Chef (ambitious) | 0% full goal; **27–48%** of it by week 120 | After the rebalance; 0 weeks overdrawn in every city |
| Solicitor | 0% | 12–28% progress |
| Founder | Berlin 100%, elsewhere 0% | Unexplained gap between cities |
| Politician | 75–98%, Lagos about 10% | After PR 4 |
| Architect (decisive) | 15–100% | The healthiest |
| Engineer | 0% | 40–76% progress |

### What to pick up next

In priority order (details in [`WORKING_PLAN.md`](WORKING_PLAN.md)):
1. Give the Solicitor and Engineer bots a strategy that reaches the objective
   somewhere.
2. Explain the Founder's Berlin-vs-everywhere-else gap.
3. Fix the victory screen, which shows the Physician's hospital for every
   career. The images are specified in [`VISUALS.md`](VISUALS.md), batch 1.
4. Human playtests: one full run per career, with notes. For the Chef, watch
   whether a human who moves up from the stall early finds it too easy.

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
- Made Politician elections losable (PR 4, merged). Measured first: positions
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

### 25 Nov 2026 — Claude (Claude Code): the Chef rebalance
Branch `balance/chef-rebalance`.

**How it was measured.** Two scratch scripts ran the harness's own Chef bots and
totalled every ledger line, command and event by category, then printed one run
week by week. To make that possible, `playChef` and `playAmbitiousChef` are now
exported from `scripts/cities.ts`.

**What was wrong (four separate things):**

1. **A dead end with no way out.** `buyProduce` refused any crate the account
   couldn't pay in cash. Once wages pushed a kitchen below the price of one
   crate, it served nobody, earned nothing and stayed there while rent and
   salaries kept going out.
   - Ambitious Paris, seed 0: 40 weeks of zero covers, ending at −$198k.
   - Mumbai: 70–94 weeks overdrawn in some seeds.

   That contradicts the README's own rule that a run has no forced ending.
2. **Labour cost too much.**
   - Wages took about 52% of covers revenue (Lyon, ambitious), against roughly
     30–35% in real kitchens.
   - A chef de partie cost about $16 per cover they added, food about $9, and a
     stall cover sold for $17–27.
   - So every staffing level at the stall roughly broke even, and the business
     only grew on pop-up ventures.
3. **Mumbai's food was mispriced.** Its produce index was 0.52 against spend of
   0.45, the only city where food cost noticeably more than its covers were worth
   (every other city is within 2.5% or cheaper). A Mumbai stall cleared about $74
   a week.
4. **A harness bug.** Both bots used fixed dollar thresholds:
   - $25k before hiring
   - $60k before the cold room
   - $90k before the cellar
   - $2.5k as a floor on food buying

   Everything else in this career is in local money, so Mumbai waited 47 weeks to
   make its first hire, and the plain bot never hired there at all.

**What changed:**

- `lib/game/careers/kitchen.ts`:
  - `TRADE_CREDIT` and `creditLine(k)`
  - `soloCovers` split out of `brigadeCovers`, with no behaviour change
  - every `KITCHEN_ROLES` salary cut by 30% (partie 1,280 → 900, and so on). Hire
    fees are unchanged, and saved staff keep their saved pay
  - Mumbai produce 0.52 → 0.46
- `lib/game/careers/chef.ts`:
  - `buyProduce` and `buyIngredient` deliver on account down to the credit line
  - past the line, the covered market still sells `basic` crates while the
    larder holds fewer than `soloCovers`
  - in `resolveWeek`, a week that settles past the credit line loses the most
    recent hire, logs it, and drops the rest of the brigade's morale by 8
- `scripts/cities.ts`: the Chef bots' fixed sums are now `localOf(kitchen(s), …)`.
  No other bot logic changed.
- `scripts/commands.ts`: one check rewritten for credit ("cannot afford" now means
  "past the line"), plus 6 new checks:
  - a short squeeze still buys food
  - a broke kitchen can cook alone, and not a crate more
  - payroll past the line loses the last hire
  - no city prices food above what its covers are worth

**Experiments that didn't work** (so nobody retries them blind):
- **Raising cook productivity** (×1.25, ×1.5 covers per role) helped Milan and
  Madrid but sank Lyon (6% → 2%) and London (−$90k), even after the credit fix.
- **Moving the payroll line** to 0 or to half the credit line changed almost
  nothing.
- **Wage levels tried:** ×0.8 still let London and New York spiral (44–52 weeks
  overdrawn). ×0.6 and ×0.65 work but are more generous than needed. ×0.7 is
  the smallest cut that clears the contracts.

**Results at 40 seeds** (ambitious bot, share of the goal at week 120, before →
after):

| City | Before | After |
| --- | --- | --- |
| Lyon | 6% | 42% |
| Milan | 18% | 48% |
| Madrid | 12% | 44% |
| Paris | 0%, 27–32 weeks overdrawn | 40% |
| London | 0% | 28% |
| New York | 0%, 15 weeks overdrawn | 28% |
| Mumbai | 4%, 36 weeks overdrawn | 27% |

Every city now has 0 median weeks overdrawn. Nobody reaches the full goal in 120
weeks; the career runs to 156. `npx tsx scripts/cities.ts 12` (what CI runs):
**all balance contracts hold for every career.**

**Verified:** type check, lint, 2,083 engine checks, build, and the full balance
suite. All 48 Chef browser tests pass (`npx playwright test -g chef`, mobile and
desktop).

**Left open** (in `WORKING_PLAN.md`):
- Chef burnout sits at 98 on any normal week. It only costs one block, so the
  meter is meaningless rather than harmful.
- The bots cap the brigade at 3 and move up late, so a human may find the Chef
  easier than these numbers say.
- The "plain kitchen ends below zero" item was a misreading: that bot is the
  control and never repays its loan by design.

### 25 Nov 2026 — Claude (Claude Code): layout review
Branch `docs/layout-review`. Documentation only; no code changed.

- **How it was measured.** A scratch Playwright script, kept outside the repo,
  opened every destination and tab of four careers at 375px and 1280px. For each
  screen it recorded the page height, the number of controls and words, and any
  horizontal overflow, and saved screenshots. The Physician used the `midrun`
  fixture; the others were new runs.
- **Findings and the ranked suggestions** are in `WORKING_PLAN.md`, section 5.
  The headline numbers:
  - The Physician's Build screen is 16 screens long on a phone.
  - The week planner takes about 1,700px on a phone.
  - On desktop, the Week screen's commit button sits about 2,330px down, with
    nothing pinned.
  - Every career's Week hero shows the Physician's doctor picture.
- **Built first: the compact week planner** (owner's choice). See WORKING_PLAN section 5.
  - Each action is now one row, with tap-to-expand details and a "Show details"
    switch kept per browser.
  - The planner is 54% shorter on a phone and 45% shorter on desktop.
  - Type check, lint, engine checks and the build pass, and all 404 browser
    tests pass (mobile and desktop, 8.2 minutes).
  - The other suggestions are still open.
- **Artwork:** the owner has an image model (ChatGPT) producing the images from
  `docs/VISUALS.md`. When they land, follow that file's "For the coding AI"
  steps. The victory-screen fix waits on batch 1.

### 26 Nov 2026 — Codex: artwork masters

The checkout moved from `docs/layout-review` to `layout/pin-week-commit` during artwork generation.

- Generated the 24 scene, banner and event PNGs from `VISUALS.md`, using the
  existing game artwork as style references. Saved the masters in
  `art-source/visuals/milestones/`, `careers/` and `events/`.
- Verified all 24 files at 1536×1024 and reviewed the centre crops at 21:9
  for milestones and events and 3:1 for the two screen banners.
- The art still needs WebP conversion and game wiring. Browser checks belong
  to that step. Decide where career-goal celebrations should show before
  applying the victory artwork to the current retirement screen.

### 26 Nov 2026 — Claude (Claude Code): pinned desktop commit
Branch `layout/pin-week-commit`. This is the second item from the layout review.

- On desktop, the Week screen's commit card now leads a pinned right column.
  The button stays on screen everywhere instead of sitting about 2,330px down.
- The details are in `WORKING_PLAN.md` section 5.
- Type check, lint and the build pass.
- The full browser suite was still running when this was committed. Its result
  is recorded in a later entry.

### 26 Nov 2026 — Claude (Claude Code): artwork wired in
Branch `art/newer-career-scenes`, built on top of `layout/pin-week-commit`.
Merge the pinned-commit work first.

- **Reviewed Codex's 24 masters** against the rejection checklist. All pass:
  no lettering, subjects inside the cropped strip, and a match with the house
  style.
- **Converted all 24 to WebP and wired 18 of them:**
  - 16 event pictures: every Founder, Politician, Architect and Engineer event
    now opens with one
  - 2 screen banners: the Politician's postbag and the Founder's product
  - A new engine check keeps that coverage. Details are in `WORKING_PLAN.md`,
    section 6.
- **The six victory scenes are converted but not shown yet.** As Codex found,
  the game's only "won" outcome is retirement (`retire()` in
  `lib/game/retirement.ts`). The end screen shows "Milestone reached" and
  the Physician's hospital picture for every retirement, whether or not the
  career goal was met. Where the victory pictures should go is the owner's
  decision.
- **Verified:** type check, lint, 2,084 engine checks and the build pass. All
  404 browser tests pass on this work by itself.
- **Pinned-commit branch:** its own suite run was cut short at 184 of 404
  (every phone test, no failures) when I switched branches. The working tree
  is what the tests serve, so **don't switch branches while the browser suite
  is running.** CI's `verify` covers the combined branch.

### 26 Nov 2026 — Claude (Claude Code): victory scenes, only for a met goal
Same branch (`art/newer-career-scenes`). The owner chose to show the victory
picture only when the career goal was reached.

- `careerGoalMet` (`lib/game/retirement.ts`) decides it: the goal bar at 100%,
  plus a cleared loan where the goal card asks for one. Use it anywhere else
  the game needs to know whether a run succeeded. Don't read
  `outcome.kind === "won"` for that, because "won" only means the player retired.
- The end screen shows each career's own scene for a met goal, and the plain
  "You retired" header otherwise.
- Verified: type check, lint, the engine checks (5 new) and the build pass.
  Both paths were checked in the browser on Physician saves. The full browser
  suite result is in the next entry.
- Not checked in the browser: the other six careers' scenes on the end screen.
  No saved game has one of those careers with its goal met. The engine checks
  confirm the registry.
