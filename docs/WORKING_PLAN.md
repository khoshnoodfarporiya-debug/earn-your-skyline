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
- [x] Rebalance the Chef (branch `balance/chef-rebalance`). Full write-up in
      `docs/COMMUNICATION.md`, section 6 and the session log
  - Traced where the money goes with the harness's own bots. Four findings:
    1. **A dead end:** below the price of one crate a kitchen could never cook
       again, while wages kept going out (Paris: 40 weeks serving nobody, −$200k)
    2. **Labour cost too much:** wages took ~52% of covers revenue against ~30–35%
       in real kitchens, so every staffing level at the stall roughly broke even
    3. **Mumbai's food cost 15% more than its covers were worth,** relative to
       every other city, so its stall made nothing
    4. **Harness bug:** both bots used fixed dollar thresholds in a career where
       everything is in local money, so Mumbai waited 47 weeks to hire
  - Fixes:
    - trade credit (`TRADE_CREDIT`, `creditLine`)
    - a market last resort to cook alone
    - unpaid payroll sheds the last hire
    - salaries cut 30%
    - Mumbai produce 0.52 → 0.46
    - local-money bot thresholds
  - Result at 40 seeds, ambitious bot: 27–48% of the goal in every city, 0 weeks
    overdrawn. **Every balance contract in the suite now holds, so CI `balance`
    should go green**
- [x] ~~Rebalance the Chef until the plain kitchen doesn't end below zero~~: **not a
      real problem.** The plain bot is the control and never repays its fit-out
      loan by design. Its cash stays positive everywhere (London ends with $31k in
      the bank). The negative net worth is the unpaid loan compounding
- [x] Bring the ambitious Chef back inside its contract: done, see above
- [ ] Chef burnout sits at 98 for almost the whole run on any normal week (a full
      week adds about 19 and only 1.6 drains). It costs one block, nothing more, so
      the meter is meaningless rather than harmful. Worth a design look
- [ ] The Chef bots never leave the market stall until late, and cap the brigade at 3.
      A human who moves up sooner may find the Chef easier than these numbers say
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

### 5. Layout and efficiency (review of 25 Nov 2026)

Measured with a Playwright script over every destination and tab of the
Physician (mid-run save), Chef, Politician and Founder, at 375px and 1280px.
"Screens" means the page height divided by one viewport.

Findings:
- **Length varies wildly.**
  - Phone: Physician Work → Build is 13,260px (**16 screens**), Life → Luxury 8.3,
    the Week screens 4.5–6.6.
  - Desktop: Build is 6.4 screens.
  - Most Politician and Founder tabs are about 1 screen. Politician Count and
    Ladder are about 80 words each.
- **The week planner is the tallest thing on the most-used screen.** Each action
  is a card with a blurb and 2–3 chips, so 8 Chef actions take about 1,700px on
  a phone and about 1,000px on desktop. It is used every week, 156 times a run.
- **Desktop Week has no pinned commit.** On the Chef's Week screen the commit
  button sits about 2,330px down. The Work screens already pin the planner in
  the right column, and phones pin a commit bar.
- **The same numbers repeat.** On the Chef's Week screen, cash appears 3 times:
  hero, status strip and observations. Week appears twice.
- **The "Learning the ropes" card** is about 330px at the top of the Week screen.
- **Desktop forecast grid** ("If you commit this week"): 5 tiles in a 4-column
  grid leave a large blank area.
- **Cramped chips on desktop.** In the narrow right-column planner (Politician
  Work), the chips wrap to one or two words per line.
- **Bug: every career's Week hero shows the Physician's banner** (a doctor in a
  white coat), because `OverviewHero` always uses `sectionVisual("overview")`.
- **Good news:** no screen overflows horizontally at 375px.

Suggestions, highest value first:
- [x] **Compact week planner** (`components/ActionBoard.tsx`, used by the Week
      screen, the desktop rail and the phone sheet).
  - Each row is icon, name, cost, the first effect line (up to two lines) and
    the stepper.
  - The name opens the blurb and every effect line (`aria-expanded`).
  - "Show details" in the header opens every row. That preference is kept per
    browser in localStorage (`career-tycoon:planner-details:v1`), not in the save.
  - Planner height on a phone: Chef 1,530 → 701px, Politician 1,499 → 718px,
    Physician 1,461 → 739px.
  - Planner height on desktop: about 1,000 → 577px.
  - The Chef's Week page on a phone: 5,180 → 3,992px.
  - Rows came out at about 75px, not the 56px target, because the effect line
    was too useful to truncate to one line.
- [x] **Pin the commit on desktop Week** (`components/overview/Overview.tsx`).
  - The inline commit button at the foot of the forecast card is gone.
  - A commit card now leads the right column: blocks free, the key forecast
    figure, and the button with the same labels as before.
  - The whole right column is pinned under the status strip
    (`lg:sticky lg:top-24`), and scrolls on its own if it is taller than the
    window, like the Work rail. Pinning only the card let the meters slide
    under it.
  - The alerts and the next step moved from full width into the left column,
    so the right column starts level with them.
  - Result at 1280 and 1024 wide: the commit is on screen at the top (468px),
    the middle and the bottom of every Week screen. Before, it was about
    2,330px down on the Chef.
  - On week 1 the "Learning the ropes" card still pushes it to 882px, just
    below the fold, until that card is hidden.
  - Phones keep their CommitBar unchanged.
- [ ] **Build screen as a shop, not a gallery.**
  - Filters: Can buy now, Owned, Later.
  - Collapsible groups.
  - Compact rows with thumbnails on phones instead of full image cards.
  - Default to what is affordable now; locked items collapse into one "Saving
    toward" line.
- [ ] **One status source.** Keep the sticky strip. Drop the duplicated figures
      from the hero, or shrink the hero to a slim title bar after week 1.
- [ ] **Collapse onboarding after first read** to a single line that reopens it,
      or move its content into the glossary.
- [ ] **Merge alerts and the next step** into one compact list, one row each,
      with the action button inline.
- [ ] **Fix the forecast grid** so the tiles fill their row.
- [ ] **Merge thin tabs.**
  - Politician: Count + Ladder.
  - Founder: Runway + Raising.
  - Fewer taps for the same information.
- [ ] **Per-career Week hero art,** or no picture for careers without one. This
      bug is listed above; the images can come from `VISUALS.md`.

### 6. Artwork

- [x] Generate the 24 PNG masters specified in [`VISUALS.md`](VISUALS.md).
- [x] Convert the masters to WebP, wire the two banners and sixteen event
      images, and check their crops in the game (branch `art/newer-career-scenes`)
  - All 24 masters reviewed against the `VISUALS.md` rejection checklist on
    contact sheets, with the 21:9 strip marked. Close-ups of the riskiest two
    (hi-vis vests, a laptop chart) show no lettering. All 24 pass.
  - `npm run build:art` converts all 24, including the six victory scenes,
    which are converted but not used yet. Every existing WebP came out
    byte-identical.
  - The 16 events are in `EVENT_VISUALS`, each with a category and a
    description over 30 characters, built by `eventScene` from the generated
    sizes.
  - New banners: the Politician's postbag (`constituents`) and the Founder's
    `product`, with captions in `CareerSceneBanner`.
  - New engine check: every Founder, Politician, Architect and Engineer event
    has artwork.
  - Checked in the game on phone and desktop. Both banners load with no
    console or network errors.
- [x] Choose where the victory scenes go, then wire them. **Owner's decision
      (26 Nov 2026): only when the career goal was reached.**
  - `careerGoalMet(career, s)` in `lib/game/retirement.ts`: objective progress
    of at least 100%, plus a cleared loan for the Physician, Chef and
    Solicitor, whose goal cards say to clear it. That matches how the balance
    harness has always counted "reached".
  - `VICTORY_VISUALS` in `lib/ui/visuals.ts` holds one scene per career, served
    at the 1200px derivative. The Physician keeps the hospital.
  - `components/Outcome.tsx` shows "Milestone reached" over the career's scene
    only when the goal was met. Any other retirement gets the plain
    "You retired" header. Before this, every retirement showed the Physician's
    hospital, whatever the career and whether or not the goal was met.
  - 5 new engine checks:
    - every career has its own scene
    - a fresh run hasn't met its goal
    - a full bar with the loan owed doesn't count
    - a cleared loan does
    - the Politician's campaign debt doesn't block its goal
  - Checked in the browser: the `midrun` save (goal at 0%) gets the plain
    header; the `nearly-won` save after one week (goal at 100%) gets the scene.

### 7. Beta, iPhone and business features (proposal, 26 Nov 2026)

The owner wants a phone-only app (iPhone first, Android later), developed as a
beta until it ships, with a cookie/privacy policy, real login, paid careers and
a reliable social feed. Nothing below is built yet; this is the suggested
order. What exists today:
- no manifest or home-screen icon
- no cookies, network calls or server
- local profiles only
- no payments
- a deterministic social feed per career on the in-game phone

1. **Beta setup** (branch `feature/iphone-install`, off `beta`)
   - [x] A local `beta` branch exists, made from all the unmerged work. Feature
         branches are named `feature/…`, because git can't have a branch
         called `beta` alongside branches named `beta/…`. They merge into
         `beta`.
     - [x] `beta` pushed 26 Nov 2026. The beta link, which always serves the
           latest beta:
           https://earn-your-skyline-git-beta-khoshnoodfarporiya-debugs-projects.vercel.app
   - [x] Version `0.9.0-beta.1` in `lib/version.ts` and `package.json`, kept
         equal by an engine check.
   - [x] "BETA vX" badge on the title screen and in the game header.
   - [x] "What's new" changelog behind the badge (native `<dialog>`). Add an
         entry for every update a player can notice.
   - [x] Feature flags in `lib/flags.ts` (`paidCareers`, `cloudSaves`,
         `feedback`), all off and locked by an engine check.
   - [ ] Feedback button. **The owner must choose where feedback goes** (an
         email address, a form, GitHub issues). It sits behind the `feedback`
         flag.
2. **iPhone, stage A: installable web app**
   - [x] `app/manifest.ts`: standalone display, portrait, navy theme, and
         192, 512 and maskable icons.
   - [x] `app/apple-icon.png` (180px) plus the `public/icons/` PNGs, all made
         by `npm run build:art` from the brand master. The no-PNG engine check
         allows exactly these three files.
   - [x] `appleWebApp` metadata (`black-translucent`, title "Skyline") and
         `viewport` (`viewport-fit=cover`, theme colour, zoom still allowed).
   - [x] Safe areas: the body pads top, left and right by the insets, and the
         sticky status strip offsets by the top inset. The bottom was already
         handled.
   - [x] Checked at iPhone 13 size in Chromium:
     - every install tag is present
     - the manifest and all four icons load
     - "What's new" opens, and closes with Escape
     - no horizontal overflow
     - no console errors
   - [ ] Test in WebKit, the engine Safari uses. This needs Playwright's WebKit
         download, plus testing on a real iPhone ("Add to Home Screen").
   - [ ] Offline service worker. Self-host the fonts first.
   - [ ] Phone-first desktop: show the phone layout centred on large screens.
3. [ ] **Privacy policy and cookies**
   - Today nothing is tracked, so no cookie banner is legally needed yet.
   - Write the privacy policy and terms before login and payments; the App
     Store requires a privacy policy URL anyway.
   - Prefer cookieless analytics, so no consent banner is needed.
   - Have a lawyer check it.
4. [ ] **Real login and cloud saves** (needs a backend: Supabase, or Clerk +
   database)
   - email magic link plus **Sign in with Apple**, which Apple requires if
     any other social login is offered
   - "play as guest" kept
   - in-app account deletion, which Apple also requires
5. [ ] **Paid careers** (needs login)
   - **Inside an iOS app, unlocking careers must use Apple In-App Purchase**
     (Google Play Billing on Android); Stripe only works on the web.
   - RevenueCat can manage all three.
   - Suggested model: 2–3 free careers, then a one-time "All careers" unlock;
     no subscription at first.
   - Everything stays unlocked in the beta behind a flag.
6. [ ] **iPhone, stage B: App Store**
   - a Capacitor wrapper
   - an Apple Developer account
   - TestFlight for beta testers
   - App Review
7. [ ] **Social feed you can rely on** (no backend needed, can run in parallel)
   - Keep the bots deterministic and rule-driven, not live AI.
   - Every reply should cite a real fact from the player's run, checked by
     engine checks.
   - A profile per bot says who they are.
   - Label them clearly as in-game characters.
   - Live AI or player-to-player social features come later: they need a
     server, moderation and money per player.

### 8. Brand and design refresh (proposal, 26 Nov 2026)

The owner feels the design isn't good and that the logo doesn't feel
authentic. Honest read of what's there:

- **The logo is an AI raster image built from stock clichés:** a skyline,
  stairs and an upward arrow. Its edges are ragged ("EARN YOUR" is smudged),
  there is no vector, and its sticker/esports look clashes with the moody,
  photographic game art.
- **The interface still looks like the medical dashboard it started as.** The
  accent token is literally `clinical` (teal), every career shares it, and
  there are many monospace figures and text walls. It reads like a finance
  tool, not a game, while the art reads like a film.

Suggested process. Agree on the brief first, then the logo, then the UI, one
screen at a time:
1. [x] **Brand brief (one page, `docs/BRAND.md`):** drafted 26 Nov 2026, waiting on the owner's answers in its section 9
   - who it's for
   - three feeling words
   - what it must not be
   - three reference apps or games
   - one sentence on what "earning your skyline" means
2. [x] **Logo.** Owner chose "the lit window", then concept E (26 Nov 2026). Master: `art-source/branding/lit-window-mark.svg`. Every icon is rendered from it by `build:art`. The name is real text beside the mark (`components/BrandLockup.tsx`). Explore 3 directions, generate rough options with an image
   model, then rebuild the winner as a real SVG. Test it at 16px, as a 180px
   app icon, and on dark and light backgrounds. Candidate directions:
   - the lit window in a tower at night
   - a type-led "Skyline" wordmark
   - an "S" built from a building's stepped setbacks
3. [ ] **Design system refresh:**
   - [ ] a mood board taken from the existing art
   - [x] **Palette** (branch `feature/lamplight-palette`, 26 Nov 2026)
     - Lamplight `#F4B860` is the default and the Physician's accent.
     - The other careers have quiet accents: copper (Chef), ink-blue
       (Solicitor), soft violet (Founder), rose (Politician), sage
       (Architect), olive (Engineer).
     - All are set as `--accent` in `app/globals.css`; the `clinical` token
       just reads them.
     - Contrast is 6.0–9.1:1 as text on cards and 7.0–10.7:1 under the new
       dark `on-accent` ink.
     - Hard-coded teal in components now uses the variable. SVG `fill` and
       `stroke` moved into `style`, where `var()` works.
     - Screenshots of all seven careers:
       `art-source/branding/concepts/lamplight-palette-sheet.png`.
     - Open: the semantic "caution" orange `#F59E55` now sits close to
       lamplight and copper. It still carries an icon and a label, but it is
       worth separating during the design pass.
   - [ ] two typefaces, the core components, and spacing
4. [ ] **Prototype one screen** (the iPhone Week screen) in Figma or as an
   artifact, and agree it before touching code.
5. [ ] **Roll out screen by screen** on `feature/` branches into `beta`,
   checking the browser suite each time.

## Dropped

_Nothing yet._
