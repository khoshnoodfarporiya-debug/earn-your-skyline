# Working plan

Started 23 Nov 2026 on branch `docs/review-and-plan`. This is the live to-do
list for the next stretch of work. Tick items off as they land; move anything
abandoned to "Dropped" with a one-line reason instead of deleting it.

## Where things stand (verified 23 Nov 2026)

| Gate | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run check` | pass, 2,067 checks |
| `npm run build` | pass |
| `npm run e2e` | not run in this pass |
| `npx tsx scripts/cities.ts 4` | 11 contract violations, all on the ambitious Chef |

The August audit's P1 code defects are all fixed:

- [x] Archive read and write use the same scoped key, and old unscoped archives are moved over (`lib/game/save.ts`)
- [x] Root validator requires every declared resource, not just "whatever is there is finite" (`save.ts:456`)
- [x] Phone answer index is range-checked on load and render (`MessagesApp.tsx`)
- [x] Founder, Politician, Architect and Engineer validate their phone state (`lib/game/phone/validate.ts`)
- [x] A stale active-profile ID goes back to the front door (`app/page.tsx`)
- [x] CI workflow exists (`.github/workflows/ci.yml`)

Balance snapshot (4 seeds, 120 weeks, so treat this as a signal, not a verdict):

| Career | Bot reaches objective | Note |
| --- | --- | --- |
| Chef (plain) | 0% in every city | Ends with negative net worth everywhere |
| Chef (ambitious) | 0% | Up to 35 weeks overdrawn (Mumbai, Paris) |
| Solicitor | 0% | 15–28% progress |
| Founder | 100% Berlin, 0% elsewhere | Earns $1.5M in London and still reaches 0% |
| Politician | 0% | Exactly 33% in every city with both bots, which looks like a wall |
| Architect (decisive) | 25–100% | The healthiest new career |
| Engineer (both bots) | 0% | 40–76% progress |

## Next up

### 1. Balance (the biggest problem)
- [x] Find out why both Politician bots stop at exactly 1 of 3 elections in every city
  (traced London, seed 1; the fix is still to do):
  - `seekSelection` sets `c.office` at once, so you draw that office's pay before any vote
  - Selections chain with no election between them: Councillor, MP, Minister by week 7
  - Two casework blocks a week halve the drift *and* lift every group, so support settles
    around 98% against a 48% bar. The drift the career is built on never bites
  - The minister's 156-week term puts the second election at week 215, past the
    120-week harness, which is the "33%" itself
  - Winning the week-40 election as "candidate" doesn't promote you (pay stays 0)
  - Party standing rose +20 and +16 in weeks 2–3, more than the actions explain (source not found yet)
- [x] Fix the Politician: office only on winning, one rung per election, casework rebalanced
  - New optional `standingFor` on the campaign; `contestedOffice()` decides what a count is for
  - Casework's all-group lift cut from 1.8 to 0.6 (`CASEWORK_LIFT`)
  - The harness judges the Politician over 156 weeks (`POLITICIAN_HORIZON`)
  - 7 new engine checks; the old "selection gives you the office" check was replaced
  - All 22 Politician browser tests pass (`npx playwright test -g politician`, mobile and desktop).
    On Windows the run exits 1 anyway because workers don't shut down after the tests; that isn't a test failure
  - Result at 40 seeds: **100% in every city, with both bots.** The wall is gone, but the career is now too easy
- [x] Make the Politician lose sometimes (branch `balance/politician-can-lose`)
  - Measured first: the lean alone (two positions + a full casework record) beat every bar by
    9–25 points, campaigning added ~34 more, and nothing on polling day was random
  - Campaign lifts shrink as a bloc rises above its lean and stop at 10 points (`HEADROOM`)
  - The casework record is capped at 4 points per bloc, down from 12 (`RECORD_CAP`)
  - Every count won costs 5 points of lean with every bloc (`TERM_FATIGUE`)
  - Higher rungs attract more opposition: member +6 points, minister +12 (was +3 and +6)
  - Polling day draws a mood swing of up to ±8 points (`POLLING_DAY_SWING`), so the poll band is honest
  - 5 new engine checks; previews and the briefing show the lift that actually lands
  - Result at 40 seeds (plain / ground game): London 75% / 85%, Lyon 83% / 88%,
    Milan 95% / 98%, Lagos 13% / 8% (Lagos median progress 67%). All contracts hold
- [ ] Positions still stack for free: taking all five best-weighted stances is worth about
      +17 points of lean against the bot's +9. A human who reads the turnout weights may
      find the even seats easy again; watch for it in the playtest
- [ ] Rebalance the Chef until the plain kitchen doesn't end below zero
- [ ] Bring the ambitious Chef back inside its contract (CI already allows it to fail)
- [ ] Give the Solicitor and Engineer a bot strategy that reaches the objective somewhere
- [ ] Look into the Founder's gap between cities (Berlin 100%, London 0%)
- [ ] Rerun at 40+ seeds before calling anything fixed

### 2. Human playtest
- [ ] Play one full run of each career to week 52, with notes on boring or confusing weeks
- [ ] Get 3–5 outside players for a first session, and record where they get stuck

### 3. Repo hygiene
- [ ] Move `CLAUDE_FULL_GAME_AUDIT_AND_ROADMAP.md` into `docs/` and mark the fixed P1s (it still names the old `career-tycoon` path)
- [ ] Split the 1,800-line README into a short README plus `docs/design/*.md`
- [ ] Split `scripts/commands.ts` (17k lines) by domain, e.g. `scripts/checks/<career>.ts`
- [ ] Split `e2e/app.spec.ts` (7.3k lines) into one spec per career
- [ ] Self-host fonts so an offline build works

### 4. Product
- [ ] Decide which 3 careers ship first, and hide or label the rest as "early access"
- [ ] Error reporting and a "send feedback" button before any public playtest
- [ ] Save export and import (a JSON download) as a cheap stand-in for cloud saves

## Dropped

_Nothing yet._
