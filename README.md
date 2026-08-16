# Earn Your Skyline

A turn-based management sim where **each career runs on its own rules**, not a
shared economy with a different skin. Inspired by Business Inc. Tycoon
Simulator, built against the opposite principle: there, every player is a
generic owner optimising the same cash loop. Here, what constrains you depends
on who you are.

The **Physician** career is complete and playable: you start as one doctor in
one rented room and finish, if it goes well, running a regional hospital.

```bash
npm install
npm run dev          # http://localhost:3500
```

---

## The design

One turn is one week. You get six time blocks. Between weeks you buy premises,
open departments, install equipment and hire staff — then commit the week and
watch the caseload resolve.

### The Physician's rule

> **Cases arrive whether or not you can treat them.**

A stroke walks in and either you have a CT scanner, an ICU bed and a
neurologist, or you refer it out and take the reputation hit. Growth is not
"buy the next tier" — it is deciding which medicine you are actually in the
business of practising.

Treating a case needs **three things at once**, and the scarcest one binds:

| | Provided by | Fails as |
| --- | --- | --- |
| **Space** | Facilities | out of physical space |
| **People** | Staff roster | out of clinical hours |
| **Capability** | Departments + equipment + a qualified clinician | no department / no equipment / nobody qualified |

Every week's ledger names which of these actually turned patients away, and
the Caseload tab breaks it down condition by condition. That is the game's
main teaching signal: it tells you what to buy next.

### Delegation is the arc

Your own hours are most of your capacity at week 1 and almost irrelevant by
week 100. Burnout still gates *you* — it blunts your skill and your personal
clinical hours, and at 100 you collapse — but hired clinicians contribute
capacity independent of you. Growing means building an organisation, not
grinding yourself.

### Content

50+ conditions across 12 specialties, from an upper respiratory infection at
$150 to a tumour resection at $17,000. 12 pieces of equipment, 4 facility
tiers, 6 staff roles, and a triage policy that decides who gets seen when more
arrives than you can handle.

### Outbreaks

An outbreak is not an event with a button — it is a condition that sits on a
city for weeks and reshapes the caseload while it runs. Affected specialties
surge (up to 2.6×) whether or not you are equipped for them, and it bleeds
risk and reputation every week.

You cannot pay it away. The three responses are the three things a clinician
actually has:

| | Cost | Effect |
| --- | --- | --- |
| **Contain** | Cheap, immediate | Isolation and screening — blunts the surge and slows it, does not end it |
| **Research** | Money **and your own CPD** | Solves the pathogen permanently, everywhere, and it never returns |
| **Vaccinate** | Expensive, needs a pharmacy | Ends it in that city and wins enormous public standing |

Research spends the same CPD the qualification ladder needs, so an epidemic
competes directly with your own career. Vaccination requires a dispensing
pharmacy, so the response depends on what you built years earlier.

**Doing nothing is a real option** and sometimes correct — a mild outbreak in a
city with spare capacity is a surge of billable work, not a crisis.

Eight pathogens, from a seasonal influenza surge to a novel respiratory virus
and a carbapenem-resistant Klebsiella loose in your own wards (which has no
vaccine at all — you research it or you ride it out).

**Pressure, not a window.** There is no week after which outbreaks stop, and
none before which they cannot start. Each week the simulation rolls against
`outbreakPressure(week, cities)` — a base rate so no week is truly safe, plus
a term for how long the run has gone on, plus a term for how many cities you
operate in. Reach is exposure: a fourteen-city empire in the endgame sits near
the 22% cap, a single Lyon practice in week three sits at 3.3%.

`severityCeiling(week)` gates what the world is allowed to send. Severity 2
before week 16, 3 before 40, 4 before 80, and the novel respiratory virus only
past that. Without the ramp a week-four run could draw a severity-five
pathogen and simply lose, which reads as unfairness rather than difficulty.

Both are pure functions, and the Outbreaks screen shows the player the same
numbers the simulation rolls against — the percentage, the band, and the worst
pathogen currently possible — rather than hiding the curve.

### Cities

You start in Lyon, where your licence already works. Fourteen markets are
open to expand into — Paris, London, New York, Tokyo, Dubai, Singapore,
Mumbai, Lagos and more — and a city is not a skin on the same market. Each
changes four things at once, pulling against each other:

| | Effect |
| --- | --- |
| `population` | Hard-caps the panel you can ever hold there |
| `feeIndex` | What the work bills for |
| `costIndex` / `propertyIndex` | What it costs to be there at all |
| `bias` | Reshapes the case mix, so different departments pay off |

New York bills at 2.10× and costs 1.72× to run: superb once filled, ruinous
before. Lagos bills at 0.40× against fifteen million people — terrible margin,
enormous ceiling. Tokyo's ageing population sends tumours and strokes, not
vaccinations, so the departments worth opening there are different.

`competition` is the share incumbents already hold, and reputation is the one
thing that prises it loose. Your **own clinical hours only count where you
are**, so a second site has to be staffed rather than visited — but staff
spread across the network in proportion to the space each city has.

Because population is a hard cap, a single mid-size city eventually walls you
in no matter how much you hire. Expanding is not optional flavour; it is how
the late game exists at all.

### The clinical ladder

Qualifications are not a score — each rung changes what *you* are allowed to
treat, checked at exactly the same gate as "do I employ a consultant for
this". So every rung is a real choice between **becoming** the specialist and
**employing** one.

| | Unlocks |
| --- | --- |
| MRCP (Membership) | Severity 3 yourself in one field; your full skill counts there |
| FRCP (Fellowship) | Severity 4; you *are* the consultant for that field |
| FRCS (Surgery) | Severity 5 — the biggest cases without a surgeon on payroll |
| PhD (Doctorate) | +10 skill on every future recruit |
| Professorship | Staff gain skill every week; +18 on recruits |

Tuition is paid in cash and **CPD points**, earned only by studying — so the
ladder competes with clinic time for your week.

### Marketing

Every channel raises your catchment. What separates them is `coupling` — the
share of reach multiplied by how well regarded you actually are. A billboard
says what you paid it to say; social media and a reviews programme say what
your patients say.

That makes word-of-mouth channels **a multiplier on substance, not a
substitute for it**: run them on good outcomes and they are the cheapest
growth in the game, run them while failing cases and they will actively shrink
your catchment.

### Lifestyle

Houses, cars, a chauffeur, a yacht. These are decisions, not rewards, because:

1. **Most of them destroy net worth**, which is half the win condition. A
   sports car keeps 40% of its price; a yacht is a hole in the balance sheet.
   You buy them for burnout relief and standing, and pay for that in the thing
   you are scored on.
2. **A few are better stores of value than cash** — an art collection
   appreciates. Knowing which is which is the game.

Status attracts better recruits, which is how a penthouse ends up affecting
whether you can treat a stroke. A chauffeur hands you a seventh time block.

### Setbacks

Nothing ends a run except the player choosing to retire. The five conditions
that used to terminate one are now **setbacks**: states you enter, that cost
you a great deal, and that you climb out of through the recovery steps in
`lib/game/setbacks.ts`. Clearing the old win condition is a milestone on the
timeline, not a credits roll.

| Setback | Trigger |
| --- | --- |
| Signed off | Burnout reaches 100 |
| Practising rights suspended | Three malpractice claims upheld |
| Business failure | Cash below −$60,000 |
| Public disgrace | Ethical standing collapses |

---

---

## Phase 1 — the interconnected simulation

Five systems added at once, on purpose: each is only worth having because the
others read it. A reputation category nothing consumes is a scoreboard; an NPC
who forgets is a name; a delayed consequence with nothing to depend on is a
timer.

### Data flow

```
loadRun()  ->  migrateRun()  ->  validateRun()  ->  RunState | null
                                                        |
Game.tsx -- setState --> saveRun()                      |
                                                        v
advanceWeek(career, state, alloc):
  0. takeDue()          consequences armed weeks ago fire FIRST, on their
                        own RNG stream, and may raise a follow-up event
  1. applyAction xN     the planner's blocks, one call per unit
  2. resolveWeek        caseload, payroll, upkeep, the six standing
                        categories, cast arrivals, phone, milestones
  3. history.push
  4. driftPeople        relationships cool if you never speak
  5. rollEvent          a raised follow-up outranks the weighted pool
  6. checkOutcome
```

### 1. The planner

Five new blocks beside the original five, each existing because a category or
a relationship had no way to be moved deliberately:

| | Cap | What it is for |
| --- | --- | --- |
| **See the people who matter** | 2 | Goes to whoever you have neglected longest. +2 staff loyalty |
| **Work the profession** | 2 | +1.6 industry influence — the category that gates chairs and contracts |
| **Look after yourself** | 2 | Builds a *fitness* stock: −0.12/wk burnout per point, decays if you stop |
| **Feed the feed** | 2 | +2.2 public popularity. Not the weekly post — the other six days |
| **Visit another site** | 2 | Lifts the city doing worst, not the biggest. Needs two cities |

Every one is capped. Without caps the dominant line is "six blocks into
whichever number is cheapest this week", which is an exploit rather than a
plan — and `npm run check` asserts the caps rather than trusting them.

Presets are **Career focus / Balanced / Growth / Recovery**, and they respect
`unlocked`: a plan can never assign a block to an action this run has no
stepper for. While burnout is high, any preset with no rest in it is marked.

### 2. Reputation, in six parts

The hard constraint was that `s.r.reputation` is written from about thirty
places and read by panel growth, recruiting, events and the objective.
Replacing it with a derived value would have meant rewriting all of them, and
any one missed would be a silent balance change.

So it is not replaced. **`s.r.reputation` keeps its key, its range and every
existing write, and is now named professional credibility** — which is what
those writes always meant. The other five are new state beside it.

| | Stored as | Moved by | Read by |
| --- | --- | --- | --- |
| Professional credibility | `reputation` *(existing)* | Outcomes, referrals, publications | Panel ceiling, recruiting, events |
| Patient trust | `repPatients` | Share of arrivals turned away | Catchment multiplier |
| Staff loyalty | `repLoyalty` | Rota, pay, firings, whether you take the blame | **Attrition — staff resign below 40** |
| Industry influence | `repInfluence` | Qualifications, publications, networking | Hiring quality, the chair |
| Public popularity | `repPopularity` | Posts, press, content blocks | Reach |
| Ethical standing | `repEthics` | Confidentiality, scrutiny, what it costs you | **Multiplies the overall** |

The derived overall is a stated formula, not a mean: a weighted sum of the
five, scaled by ethics (0.72x at zero, 1.09x at 100). Being trusted is worth a
little; being distrusted costs a lot.

Every movement goes through `applyRep(s, id, delta, why)` and the reason is
stored. The Standing screen reads those reasons back — a bar that moves without
saying why is the failure this system exists to fix.

### 3. People

Ten written characters, not a generated contact list. Three numbers, kept
separate because the interesting positions are the mixed ones — a rival who
respects you and does not like you is a different problem from a friend who
likes you and thinks you are careless.

- **warmth** −100…100 · **trust** 0…100 · **respect** 0…100
- **traits** scale reactions: a *proud* person takes a slight 1.35x harder, a
  *loyal* one 0.7x, a *cynic* was never surprised
- **memory** is a list of facts. Week 12's decision is why someone refuses you
  in week 80
- Neglect cools a relationship and never manufactures hostility: warmth decays
  toward zero after eight weeks of silence, and stops there
- Entry is gated: an investor does not call a one-room practice, so he joins
  the run the week it earns him

`lib/game/people.ts` is career-agnostic; `lib/game/medical/cast.ts` is the
Physician's cast. Chef and Solicitor bring their own people to the same
machinery.

### 4. Event chains

Four storylines with delayed consequences, rather than more one-shot alerts.

| Chain | Opens on | The fuse |
| --- | --- | --- |
| **The registrar** | Staff, week 14+, credibility 40+ | 14 / 9 / **22** weeks |
| **The audit** | Two sites, week 22+ | 11 / 16 weeks |
| **The partnership** | Two cities, Thorne's respect 25+ | 18 / 20 weeks |
| **The chair** | Week 45+, opportunity score 58+, Hallam's respect 45+ | 8 weeks |

A pending consequence is **data, not a closure** — a closure cannot be
serialised, so the effect is a named kind the career resolves. A save carrying
a kind from a build where that storyline existed is dropped harmlessly rather
than crashing on a missing function.

Several re-check the state that armed them and *fizzle* if it changed. The
registrar you covered for only comes back if your ethics never recovered; the
contested audit closes quietly if you cleaned the practice up afterwards. A
threat that fires regardless of whether you fixed the thing is not a
consequence, it is a timer.

The chair is decided by `opportunityScore` plus your mentor's respect — not by
a die. A player who built popularity instead of influence loses it, and should.

Two engine rules keep a storyline readable: a chain gets **one event at a
time** (no two beats of the same story in one week), and follow-ups are
`followUp: true` so they can only ever be pulled by id — the sequel can never
arrive before the original.

### 5. The timeline

Every entry is something that actually happened. `mark` is idempotent per id,
so call sites can be blunt: the moment something is true, mark it, and the
second call does nothing.

A run migrated from an older save **starts with an empty timeline** and fills
from that week forward. Inventing a first promotion the player may never have
had would make the whole feature untrustworthy, so the gap is the honest
answer.

### Save migration, v8 → v9

The old rule was "an unreadable save must be discarded, not salvaged". For a
*corrupt* save that is still right. But a save from an older build is not
corrupt — it is complete and correct for the game that wrote it. The two cases
are now separated:

- **Older but structurally sound** → migrated forward with safe defaults
- **Malformed, or for a career that no longer exists** → still rejected

`loadRun` reads the newest key present, migrates, validates the *result*, then
writes it back at the current key and removes the old one — so the upgrade is
paid once. Migration is additive, idempotent, and never changes a value the
player earned.

The new categories are seeded from signals the old save already carried, so a
well-run practice does not arrive claiming neutral everything:

```
credibility <- s.r.reputation                        (unchanged)
patients    <- 50 + (credibility - 50) x 0.5
influence   <- 20 + (phone trust - 50) x 0.6
popularity  <- 10 + (phone sentiment - 50) x 0.8
ethics      <- 70 - (phone scrutiny x 0.4)
loyalty     <- 50
```

`migrateRun` runs *before* validation, so it is the one place in the codebase
that copes with genuinely unknown input. It reads defensively and returns
neutral values rather than throwing.


## Consumables

Dressings, cannulas, reagents, the drugs you hand over. Every treated case
burns some, priced **per case by severity** ($4 minor → $45 critical) rather
than as a share of revenue.

That choice was made by simulation. A revenue share was tried first and
flattened the strategy space — it taxes whichever line is winning hardest, so
expansion and marketing lost most of their advantage and four separate
strategies converged on the same win rate. Consumables track clinical
*activity*: a dressing costs the same whoever is paying for it.

The decision is not whether to buy, it is whether to tie up cash for a
discount:

| | |
| --- | --- |
| **Auto-order** (default on) | Any shortfall is bought at short notice, full price. Never blocked, worst rate. |
| **Standing order** (4 wks) | 12% cheaper per case |
| **Bulk order** (12 wks) | 20% cheaper |
| **Annual contract** (26 wks) | 28% cheaper |

Turn auto-order off and running dry cuts capacity to 60% for two weeks — the
gamble, and the reason the stock room is worth looking at.

## Communications manager

A non-clinical hire ($5,200, $1,450/wk) that makes the one post you publish
each week land better and hurt less. Deliberately **not** a second post per
week — one meaningful post is the rule that stops Pulse becoming a lever you
pull six times.

- **+35% reach** on everything you publish
- **−40% hazard** — they read it before it goes out
- **−2 scrutiny per week** — they answer the press so the story closes

All three return the no-op value at zero comms staff, so the balance contract
holds for a run that never hires one. They are also listed explicitly in
`computeCapacity`, because the fallback branch there would otherwise count a
new role as a treating clinician.

## The phone

The management screens show what the practice is *doing*. The phone shows how
everyone else reacts to it — a fictional device with a fictional network. It
connects to nothing: every line is authored and selected deterministically
from run state and a seeded stream.

Three apps: **Pulse** (post, and see the feed react), **Messages** (staff,
recruiters, journalists, regulators — some carrying decisions), and **News**
(outbreaks, competitors, regulation, written from your own run).

The handset is 400px wide and had two stacked bars of chrome above any content
— a "Personal device / Close" strip from the dialog and a "WK n / Pulse OS"
strip from the shell. One status bar now carries both, the way a real one
does. The composer is collapsed by default: by mid-run eleven posts are
eligible, and rendered open they filled the entire screen, so the feed — the
thing you open the phone to read — started below the fold. Each app closes
with a quiet end-of-list line, because a one-message inbox otherwise ends in
half a screen of blank navy that reads as a failed load.

### Four audiences, kept separate from reputation

Reputation is clinical standing, earned by treating people well. These are
earned by what you *say*, and they pay out differently:

| | Effect |
| --- | --- |
| **Followers** | Reach. Sizes the reaction to everything you publish. |
| **Trust** | What clinicians think. Better recruits. |
| **Sentiment** | What the public thinks. Wider catchment. |
| **Scrutiny** | How closely you are watched. More malpractice risk. |

**Balance contract:** every coupling returns exactly zero at the starting
values (trust 50, sentiment 50, scrutiny 0), and the phone draws from its own
RNG stream. The engine rolls events from the shared stream *after*
`resolveWeek` returns, so a single extra draw there would shift every event in
the game. A run that never opens the phone therefore plays bit-identically to
one from before it existed — which is what keeps the balance harness
meaningful.

### Posting

One meaningful post per week, enforced in the command layer rather than by a
disabled button. Seventeen authored posts across thirteen categories, each
offered only when the run supports it and each stating its trade before you
publish.

Confidentiality is a real mechanic. The anonymised case study is always
available and always slightly worse than the vivid one; the vivid one carries
a 40% chance a patient recognises herself, and the regulator writes to you
when she does. The same applies to outbreak warnings: accurate ones build
trust and sentiment together, exaggerated ones reach four times as far and
carry a 50% chance of public correction.

Identity is a derived label, not a progression system — *Trusted educator*,
*Celebrity doctor*, *Luxury influencer*, *Controversial disruptor* and so on
are read off the shape of your standing.

### The cast

`lib/game/medical/bots.ts` — twelve named accounts across six roles (peers,
rivals, press, public, authorities, influencers) who post in your feed and
reply to what you publish. Previously the feed carried one random rival line a
week, which read as a screensaver; the accounts now post about what is
actually happening in the run, guarded on real state:

```ts
{
  role: "press",
  when: (c) => c.outbreak !== null,
  body: (c) => `We are hearing ${c.outbreak!.city} clinics are seeing
                ${c.outbreak!.pathogen} presentations well above baseline…`,
}
```

Zero to two posts a week, at most one per role, with ambient chatter as the
fallback so a quiet week is quiet rather than empty. Who replies to your own
posts is your standing: trust decides the warmth of the pool, scrutiny brings
the press and the regulator in, reach decides how many bother at all.

Every line is authored and selected deterministically — **no LLM, no network,
no external service**. The cast draws from the phone's own RNG stream, so the
same seed and the same play produce the same feed, and adding it did not move
a single balance figure.

---

## Interface structure

The game's systems grew faster than its navigation did: nine equally-weighted
tabs, wrapping onto three rows at 375px, with the single most important
control — Commit week — about 1,700px down the page. A new player could not
tell which of the nine mattered, and a returning one had to audit every panel
to find what needed attention.

### Five destinations, not nine tabs

| | Answers |
| --- | --- |
| **Overview** | What do I do this week? |
| **Practice** | What am I able to treat? (Build · Staff · Caseload) |
| **Network** | Where am I, and what is happening out there? (Cities · Outbreaks · Growth) |
| **Career** | What am I qualified to do myself? |
| **Life** | What is all this for? |

### The network map

Network → Cities opens on a live world board. Every market is a marker; the
marker says whether it is unlicensed, licensed-but-empty, or operating;
outbreaks show which city they broke out in and when; and selecting one gives
you that market's figures and its buy controls in place.

The map is **drawn, not photographed**. `lib/ui/worldmap.ts` holds a stylised
world as a couple of dozen SVG polygons — no tile server, no mapping library,
no API key, a few hundred bytes that render at any size. The original artwork
survives only as a 7% luminosity texture behind it, because a picture of a
place cannot tell you where your clinics are.

It is a strategy board, not an atlas. Europe is drawn larger than a true
projection allows, because seven of the fourteen markets are inside it and they
have to stay far enough apart to label and to tap; `cities.ts` carries both the
coordinate and a hand-tuned label offset for each one. Two invariants are
tested rather than eyeballed: every city sits on a landmass (ray-cast against
the real path data), and every pair of markers clears a 40px touch target at
the narrowest board the layout allows.

Below the map, a city navigator lists all fourteen markets and stays
synchronised with it in both directions. On a phone the board keeps its full
width and pans sideways; picking a city from the navigator centres it. That is
also the reliable path for a screen reader, and it means nothing on the map is
ever the only way to reach something.

`networkNodes()` and `networkRoutes()` derive everything from run state alone,
so a marker can never imply premises you have not bought, and routes always
originate from wherever you currently work.

Nothing was removed. The screens that are *consequences* of other decisions —
Caseload, Growth — moved inside the section that causes them rather than
competing with it. A thumb-reachable bar on mobile, a rail in the header on
desktop, identical hierarchy in both.

### Overview

One screen carrying the whole loop, ordered by urgency: vitals → what is on
fire → what to do next → the objective → your week → commit. Supporting detail
(meters, trend, case notes) sits below on mobile and beside on desktop.

- **Status strip** — week, cash against weekly burn, debt and unspent time,
  sticky so it stays true while scrolling.
- **Alerts** are derived, not stored (`lib/ui/alerts.ts`). Each names the
  problem, says why it matters, and links to the exact screen that fixes it.
  Severity carries an icon and a written word as well as a colour.
- **Quick plan** — a row above the allocation board. A full week is six blocks
  across five steppers, 156 times a run, and most of those weeks are a week the
  player has already decided on. So: **Repeat last week**, or one of four named
  plans (See patients / Balanced / Grow / Recover), then adjust with the
  steppers for the weeks that actually differ. Every plan is expressed purely
  in blocks the player could have assigned by hand — nothing here can produce
  an allocation the board could not.
  The remembered plan lives under its own storage key
  (`career-tycoon:lastplan:v1`), deliberately **not** in the save: it is a
  convenience, not a fact about the run, and it would otherwise mean a save
  version bump and a validator change for something that alters nothing in the
  simulation. It is re-clamped to the current budget and the current action
  list on every use, so a stale or hand-edited value cannot inject an action.
  While burnout is high (≥ 68, the same threshold the alert panel uses), any
  plan that assigns no rest is marked — a one-tap button must not be able to
  quietly end a run at burnout 100.
- **Commit bar** — pinned above the nav on mobile, showing remaining blocks and
  whichever forecast figure is currently a warning.
- **Trend** — recent net results as columns above and below a zero rule, so
  "is this improving?" reads as a shape. The engine records each resolved week
  to `RunState.history` once the ledger is complete (after the outlay line is
  added, or the net would be wrong), so the trend is saved with the run.

### Onboarding

Progressive disclosure with no tutorial modal. `lib/ui/guidance.ts` derives a
single next step from where the run actually is — how a week works, then
committing, then capacity, then departments, then delegation, and only later
qualifications and expansion. Each is dismissible and never returns.

### Accessibility

The weekly review is a real dialog: `role="dialog"`, `aria-modal`, labelled by
its heading, focus moved in and trapped, background scroll locked, and focus
returned to `<main>` on close — not to the commit button, which is disabled
the moment the week is committed and so cannot hold focus. Escape closes a
quiet week but deliberately not one carrying an event, because the event is a
decision the run cannot continue without.

Every text/surface pair in the new components clears WCAG AA (5.75–14:1).

---

## Visual direction

A career-tycoon interface, not a hospital admin tool. The earlier pass leaned
on atmosphere — layered navy grounds, top-lit panel edges, borders on
everything, segmented instrument gauges — and the result read as a dense
medical dashboard: every element bordered, every figure the same size, nothing
telling you what mattered.

The current system is flat surfaces and typographic hierarchy. Depth comes
from three surface levels, not from lighting effects.

- **Surfaces** — `void` → `paper` → `card` → `card-high`, borderless. A panel
  is distinguished from its ground by *being lighter*, not by being outlined.
  Rules (`rule`, `rule-soft`) are hairlines between rows, not frames.
- **Type scale** — `.t-page` / `.t-section` / `.t-card` / `.t-body` /
  `.t-label` / `.t-value`, so size carries rank. Saira Condensed for signage,
  Barlow for body, IBM Plex Mono with tabular figures for every number.
- **Accent economy** — mint (`clinical`) means *yours / active / do this*, and
  is spent sparingly. Gold marks a market you can afford but have not entered.
  Everything else is `good` / `caution` / `alarm` / `info`, each with a tint
  for backgrounds.
- **Signature: the department colour system.** Twelve colours, one per
  specialty, applied as a left spine to anything belonging to a department —
  the department card, a staff member, a ward-list row, a qualification, an
  outbreak. Colour always means the same thing, so the caseload reads without
  a legend. It encodes the game's central question: which medicine are you
  actually in?
- **Motion** — panels rise on entry, the week's result slams in like a result
  screen. `prefers-reduced-motion` disables all of it.

Token names were kept across the rewrite, so roughly four hundred call sites
re-skinned from one file rather than being edited individually.

### Shared primitives

Practice, Career, Life, Staff and Supplies are all the same decision wearing
five different costumes: what is it, what does it do, what does it cost, can I
afford it, do I own it. That shape is now one component.

| | |
| --- | --- |
| `Panel` | Section frame — title, right-hand figure, one-line purpose note |
| `StatRow` | Hairline-separated figures under a panel header |
| `ItemCard` | A purchasable: spine, title, blurb, price, chips, details, blocker, actions |
| `Chip` / `ChipRow` | Short tokens — `+34 slots`, `40 CPD`, `$420/wk` |
| `ActionButton` | The one purchase button, in `primary` / `quiet` / `danger` |

Three decisions inside `ItemCard` changed how the screens read:

- **The price is the largest thing in the card.** It is what the player is
  deciding about, and it used to be small grey text sharing a baseline with
  the title.
- **Out of reach is not disabled.** Everything unaffordable rendered at 60%
  opacity, which reads as broken rather than as something to save toward. The
  card stays fully legible, only the action dims, and the gap is stated in
  cash — *"$546,323 short"*. The same applies to an event choice you cannot
  afford, which used to hide the very line explaining what you were losing.
- **A card is an `<article>`, not a `<button>`.** Practice wrapped each card in
  a button, so its accessible name was the title, the blurb and every figure
  read as one label. Now the card is an article a screen reader can move
  between, and the button is named `Buy`.

Every text/background pair clears WCAG AA, focus is visible, and the layout
holds from 375px up with no horizontal overflow.

---

## Architecture

The engine knows nothing about medicine. It hands out time blocks, applies
actions, asks the career to resolve the week, rolls events, and checks for an
outcome. Everything career-specific lives in one `CareerDef`.

```
lib/game/
  types.ts            CareerDef contract — the whole extension surface
  engine.ts           turn resolution, event rolling, command dispatch
  rng.ts              seeded mulberry32 (runs are reproducible)
  careers/doctor.ts   the Physician: resources, actions, weekly maths, events
  medical/
    types.ts          domain model
    data.ts           all content — conditions, specialties, equipment, staff
    sim.ts            capacity, case generation, triage, treatment outcomes
    cities.ts         markets, their economics and their epidemiology
    outbreaks.ts      pathogens, their surges and the three responses
    supplies.ts       consumables, bulk tiers and the stock-out throttle
    social.ts         the four audiences and how they touch gameplay
    posts.ts          the authored Pulse catalogue
    phone.ts          phone state, weekly world generation, storage caps
    progression.ts    the qualification ladder and what it lets you treat
    marketing.ts      campaigns and the catchment multiplier
    lifestyle.ts      homes, cars, perks, and what they cost you
lib/ui/
  navigation.ts       the five-section nav model
  alerts.ts           urgent state derived from the run
  guidance.ts         the next-step onboarding sequence
  visuals.ts          artwork registry: paths, framing, alt text, stage bands,
                      networkNodes() and networkRoutes()
  worldmap.ts         the stylised world as SVG polygons, plus route curves
                      and the on-land test
components/
  Game.tsx            shell only: routing, the week transaction, the header
  nav/                PrimaryNav (mobile bar / desktop rail), SectionNav
  overview/           StatusStrip, AlertStack, NextStep, CommitBar, TrendCard
  phone/              Phone (dialog), PhoneShell, PulseApp, PostComposer,
                      MessagesApp, NewsApp, Avatar
  visuals/            ArtFrame (the shared image+scrim frame), PracticeEvolution,
                      NetworkMap, CityDetail, EventVisual
  medical/            the management screens
public/visuals/       runtime WebP only — this directory ships
art-source/visuals/   PNG masters, ~51MB, never deployed
e2e/                  Playwright specs and engine-written save fixtures
scripts/              balance harness, tracer, command checks, fixture builder
```

`lib/ui/*` is pure and dependency-free, so what counts as urgent and what the
game teaches next can be reasoned about without rendering anything.

Stability measures worth knowing about: the run log is capped at 120 entries
(it is re-serialised to `localStorage` every week), `clampResources` resets any
non-finite value so a single bad divide cannot poison a run permanently, and
the save key is versioned with full field validation on load.

Careers carry structured state on `RunState.data` and expose a `command`
handler, so all purchasing and hiring routes through one audited path
(`runCommand`) that clones state, applies, and clamps. Adding medicine is
adding rows to `data.ts`, not writing code.

---

## Verification

The economy is too interlocking to hand-tune, so it is simulated rather than
guessed.

```bash
npm run typecheck
npm run lint                 # TypeScript, React hooks, Next, a11y, dead code
npm run check                # command contracts, save validation, visual registry
npm run balance              # win rates per strategy, 40 seeds each
npm run balance -- 250       # the authoritative pass; 250 seeds, 95% intervals
npm run trace builder 1074   # week-by-week table for one run
npm run fixtures             # regenerate the deterministic browser fixtures
npm run e2e                  # Playwright: 64 tests across mobile 375 and desktop 1440
npm run build
npm audit --omit=dev --audit-level=moderate
```

`npm run e2e` preloads saves written by the real engine (`e2e/fixtures/`,
produced by `npm run fixtures`) rather than clicking through twenty weeks or
exposing debug controls. Regenerate them whenever the save shape changes: a
fixture that no longer validates fails loudly instead of silently testing a
shape the app has moved past.

Balance harness, current results:

Run `npm run balance` for a fast 40-seed pass, or `npm run balance -- 250`
when a difference actually needs to be believed. The figures below are 250
seeds per strategy, with 95% confidence intervals.

| Strategy | Win rate (250 seeds) |
| --- | --- |
| Grind (all clinic, no hiring) | 0% |
| Coast (all rest) | 0% |
| Generalist (capacity only) | 0% |
| **Influencer (standing over substance)** | **0%** |
| Baller (builder + lifestyle) | 39% ±6.0 |
| Builder (follows the caseload) | 44% ±6.2 |
| Marketer (builder + campaigns) | 46% ±6.2 |
| Empire (builder + cities) | 49% ±6.2 |
| Magnate (cities + campaigns) | 51% ±6.2 |
| Epidemiologist (magnate + response) | 65% ±5.9 |
| **Academic (builder + ladder)** | **74% ±5.5** |

**Phase 1 moved these materially, and downward.** The previous table had
Academic at 91% and Epidemiologist at 89% — close enough to guaranteed that
the top of the game was solved. Adding five competing activities, staff who
resign, and patients who notice being turned away compresses the field into a
39–74% band. By the design's own criteria that is healthier, but it is a real
change and not a rounding difference.

The harness itself was updated too, because it had to be: every strategy now
spends its first blocks on `upkeep` — seeing your people when loyalty dips,
exercising when burnout climbs. Without that the bots took all of Phase 1's
penalties and none of its benefits, which measured an out-of-date bot rather
than the design, and cost every line about thirty points.

**Influencer** is in the harness permanently as an exploit check. It leans as
hard as the caps allow on networking, content, relationships and fitness, and
buys nothing clever. It exists to fail: if soft standing were a shortcut, it
would beat the strategies that build a practice, and the reputation system
would be an exploit wearing six labels. **0% at 250 seeds.**

A difference is only claimed below when the two 95% intervals do not overlap.
Everything else is recorded as untested, however suggestive the point estimate
looks.

#### Proven — the intervals do not overlap

- **The degenerate lines never win.** Grind collapses early; Coast and
  Generalist go bankrupt. Generalist is the pointed one: it buys premises and
  hires freely but never opens new departments, which is why the medical layer
  is not decoration.
- **Standing is not a shortcut.** Influencer spends every block the caps allow
  on networking, content, relationships and fitness. 0%. Reputation opens
  doors; it does not treat anybody.
- **The clinical ladder is still the strongest line measured.** Academic 74%
  (68.5–79.5), clear of Magnate 51% (44.8–57.2) and of everything below it.
- **Answering outbreaks is worth having.** Epidemiologist 65% (59.1–70.9)
  against Magnate 51% (44.8–57.2) — the same expansion plan, plus a response,
  and the intervals are clear.

#### Not proven — the intervals overlap

- **The mid-table is a plateau, and it got flatter.** Baller 39, Builder 44,
  Marketer 46, Empire 49 and Magnate 51 all sit inside each other's intervals.
- **Academic over Epidemiologist.** 74% (68.5–79.5) against 65% (59.1–70.9) —
  they now touch, where the previous build separated them.
- **Expansion over marketing — RETRACTED.** The last phase claimed Empire
  (71%) beat Marketer (54%) with non-overlapping intervals. After Phase 1 it
  is Empire 49% (42.8–55.2) against Marketer 46% (39.8–52.2), which overlap
  substantially. That claim no longer holds and is withdrawn rather than
  quietly dropped.

Treat the mid-table as flat until a strategy is written that separates from
it. The harness always takes the *first* option on events, so every figure is
a floor, not a ceiling — and Phase 1's chains make that floor more pessimistic
than before, since the first option is often the expensive or effortful one.

### Bugs these caught

Worth recording, because none were visible from reading the code:

- **Demand oscillated violently.** Panel growth compounded off its own size,
  so a good reputation grew the panel far past any possible capacity, the
  resulting referrals destroyed that reputation, and the panel collapsed —
  repeatedly. Demand now approaches a ceiling set by your premises and
  standing instead of compounding.
- **General practice was unplayable.** Nearly every GP condition was gated
  behind a lab or ECG, so a starting doctor could treat two of seven and bled
  cash from week 1. A GP now diagnoses most of it clinically.
- **The ledger blamed the wrong thing.** It reported "out of clinical hours"
  whenever anyone was turned away, including when the real gap was a missing
  department — sending the player to hire staff who would have had nothing to
  do. It now names the dominant blocker.
- **Rapid clicks were lost.** The allocation control rebuilt state from a prop
  captured at render, so several quick clicks collapsed into one and a click
  on a *different* action discarded everything before it. Now a guarded
  functional update that also enforces the time budget.
- **A whole system was silently disabled.** The marketing strategy required
  1.6× capacity headroom before buying a campaign — a bar that was never met
  once in 126 weeks, so the branch never ran and the results were identical to
  the baseline *to the dollar*. Matching numbers are a symptom worth chasing.
- **Old saves crashed the game.** Adding qualifications, campaigns and
  lifestyle changed the shape of `RunState.data`; a save from the previous
  build loaded into a UI expecting arrays that were not there. The save key is
  versioned and `loadRun` now validates every expected field.
- **Outreach ignored the population cap.** A city's panel could be pushed past
  the number of people who live there, so one mid-size city grew without limit
  and expanding never paid. Lyon was sitting at 3,569 against a ceiling of
  2,070.
- **Expanding reliably bankrupted you.** A new market's upkeep starts on day
  one while its panel takes twenty weeks to fill. Opening now seeds a panel
  scaled by reputation — a practice with a name arrives with patients waiting.
- **The expansion bot settled for the cheapest market.** Filtering candidate
  cities by affordability *before* ranking them meant it always took Mumbai or
  Lagos and never reached Paris or Tokyo at all. It now picks the best market
  and waits to afford it.
- **A wide table broke the mobile layout.** The city table's `min-w` forced
  its grid column past the viewport, because grid children default to `auto`
  and will not shrink below their content. `min-w-0` on both columns.
- **The bottom bar detached at tablet width.** The shell renders one nav
  instance below `lg` and another above it, but the component's own classes
  still switched at `md` — so between 768 and 1023px the mobile bar went
  `static` and dropped into the page flow. Every internal breakpoint now
  matches the gate the shell renders it behind.
- **Outbreaks stopped mattering after the opening.** Spawning was gated on
  `week > 8` with a flat rate, so a long run's danger did not grow with it.
  Replaced with a pressure curve and a severity ceiling — and re-measured,
  because it moved the numbers: Marketer fell 65 → 54, and **Empire (71 ±5.6)
  separated from Marketer (54 ±6.2) for the first time**, so expansion is now
  demonstrably better than marketing rather than merely believed to be.
- **A card was its own button.** Practice wrapped every purchasable in a
  `<button>`, so a screen reader announced the title, the blurb and every
  figure as a single label three sentences long. Found while writing the
  browser test that now asserts a purchase control's name is the verb alone.
- **Patient trust was pinned at zero for entire runs.** Phase 1 penalised
  turning people away at 0.02 per person, but referring work out is the
  *normal* state of this game — cases arrive whether or not you can treat
  them. The threshold fired every week from about week 60 onward, and because
  patient trust multiplies the catchment ceiling it became a permanent tax on
  the whole economy worth about twenty points of win rate. Found by probing a
  run and printing the category each thirty weeks, not by reading the code.
  Now a share-based signal with its neutral point at a third of arrivals.
- **A preview promised an effect that was never implemented.** The exercise
  block advertised "a permanent −X/wk on burnout" and built a `_fitness`
  stock that nothing read. It cost a block and did nothing beyond the one-off
  −5. Caught while hunting the balance drop.
- **`startRun` ignored its own cast gates.** Every person joined at week one,
  including the investor who is supposed to appear once you run two cities,
  making the `appears` predicates decorative. Caught by the test asserting a
  gated person is *absent*.
- **A whole validator branch was passing vacuously.** `startRun` never
  initialised `repLog`, so `validateRun` rejected a fresh save — which meant
  every "malformed input is rejected" assertion was true for the wrong
  reason. The suite now asserts the unmutated save is *accepted* first.
- **A convenience button could end the run.** The first quick-plan pass
  offered "Balanced" and "Grow" unconditionally; at the mid-run fixture's
  burnout of 81 either one is fatal, turning six deliberate clicks into a
  single fatal tap. Restless plans are now marked whenever burnout is high.
  Caught by the browser suite, not by review.

---

## Assets

Two directories, and the distinction matters for deployment size:

| | Contents | Shipped? |
| --- | --- | --- |
| `public/visuals/` | 25 runtime WebP files, ~4MB total | yes |
| `art-source/visuals/` | 26 PNG masters, ~51MB total | **no** |

The masters were moved out of `public/` because Next copies that directory
verbatim into the production output — the PNGs were adding ~51MB to every
deploy while the browser only ever requested the WebP. Both trees keep the
same subfolder layout (`careers/`, `cities/`, `events/`, `milestones/`).

Nothing in the application builds an image path by hand: every path lives in
`lib/ui/visuals.ts`, and `npm run check` asserts that each one resolves on
disk, that no PNG has crept back into `public/`, and that the 26 masters are
still where they belong.

To add artwork: put the master in `art-source/visuals/…`, generate a WebP
beside it in `public/visuals/…`, and add one registry entry.

---

## Status

Playable end to end: career select → build/staff/caseload management → weekly
allocation → live forecast → ledger → events with choices → win/lose screen
with a run history. Progress saves to `localStorage`, and a save that fails
validation is discarded rather than repaired.

**Physician is the only implemented career.** Chef and Solicitor are designed
— they have preview cards, cover art, difficulty, advantages and risks on the
select screen — but neither has a `CareerDef`, so both are marked CLOSED and
cannot be started. The engine already supports them; each is one `CareerDef`
away, and Physician is the baseline they should be built against.

Not built: sound, the two stubbed careers, difficulty modes, meta-progression
between runs.
