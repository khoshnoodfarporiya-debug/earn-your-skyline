# Visuals — image prompts for an image model

Claude can't generate images. This file is written so that ChatGPT (or any
image model) can make the missing artwork, and so that any coding AI can wire
the results into the game afterwards.

The game already has about 300 images. **The job here is to fill real gaps in
the same style, not to restyle the game.** Every image below has a specific
place on a specific screen.

---

## How to use this file (for the person running ChatGPT)

1. **Start a new ChatGPT chat for each batch.**
2. **Upload the reference images** listed for that batch. They are PNGs in
   this project, under `art-source/visuals/…`. Say: *"Match the look of these
   images exactly: lighting, colour, realism and mood."*
3. **Paste the [house style](#the-house-style) block once** at the start of the
   chat.
4. **Send one prompt at a time.** Ask for a **landscape 1536×1024** image.
5. **Check the result against the [rejection checklist](#rejection-checklist).**
   Regenerate anything that fails it. Text artefacts are the most common
   failure.
6. **Download the PNG, rename it exactly** as the prompt says, and save it
   to the folder shown. Don't crop or resize it.
7. **Tell the coding AI it's there.** The steps for wiring it in are in
   [For the coding AI](#for-the-coding-ai-after-the-images-land).

If you change an image later, save the new one as `-v2` instead of `-v1`, and
keep the old file.

---

## The house style

Paste this block first in every ChatGPT chat:

> **House style for every image in this chat.** Photorealistic, cinematic
> editorial photography, as if shot on a 35mm full-frame camera with a 35–50mm
> lens. Low-key lighting: deep navy and charcoal shadows. Warm tungsten
> practical light (desk lamps, pendant lights, a lit doorway) against cool
> blue ambient or window light. Muted, slightly desaturated colour with warm
> amber highlights. Moderate depth of field. Real, worn, lived-in materials.
> People are absorbed in what they are doing: seen from behind, in profile or
> three-quarter, never posing for or looking into the camera, and never the
> sharpest thing in the frame unless the prompt says so. The cast is
> naturally diverse in age and ethnicity. Documentary mood: quiet, serious,
> slightly late in the day.
>
> **Never include:** any readable text, letters, numbers, signage, logos,
> watermarks, brand marks, captions, or user-interface text on screens or
> paper. Paper and screens show only blurred, illegible marks. No real or
> recognisable people. No famous landmarks. No glossy stock-photo look, no HDR,
> no oversaturation, no cartoon or 3D-render look.
>
> **Composition for every image:** landscape 1536×1024. The game crops these
> to a wide strip, keeping roughly the middle half of the height. Keep the
> subject and everything important inside the central horizontal band. Let
> the bottom quarter be darker and visually quiet, because the game lays a
> gradient and text over it.

### Why these rules exist

- **No text.** Image models garble lettering, and the game always shows
  numbers and words in real HTML on top of the picture. A baked-in price or
  name would be wrong the moment the game changed.
- **The central band.** Scene banners show a 3:1 strip and event cards show a
  21:9 strip, both taken from the middle of a 3:2 image. Anything at the top
  or bottom edge gets cut off.
- **The dark bottom.** The game places its caption and a gradient there.

### Rejection checklist

Regenerate the image if any of these is true:
- any letters, numbers or logo-like shapes, even garbled ones
- a face staring into the camera, or one that looks like a celebrity
- the main subject sits in the top or bottom quarter of the frame
- it is noticeably brighter, more colourful or glossier than the reference images
- hands, fingers or objects are visibly malformed
- it looks like a 3D render, an illustration or a stock photo

---

## Batch 1: Victory screens (highest priority)

**The problem:** when you win a run, every career shows the Physician's
hospital picture (`milestone-hospital-victory`). A Politician or a Chef who
wins sees a hospital. Each career needs its own.

**Where it shows:** the top of the end screen, cropped to a 21:9 strip with
a full dark gradient. The words "Milestone reached" and the run's title sit
over the **bottom-left**. Keep that area calm and darker.

**Mood:** earned, quiet triumph. The top of the trade, late in the day. No
confetti, no fists in the air, no champagne spray.

**Upload as references:** `art-source/visuals/careers/career-politician.png`,
`art-source/visuals/careers/chef-dinner-service-v1.png`,
`art-source/visuals/milestones/milestone-first-million-v1.png`.

**Save to:** `art-source/visuals/milestones/`

The Physician keeps the existing hospital picture, so there are six new
images.

### 1.1 `milestone-victory-chef-v1.png`
> A celebrated destination restaurant at the end of a fully booked night. Wide
> shot from the back of a softly lit dining room toward an open kitchen. The
> last guests linger over candlelit tables. In the kitchen, a head chef in a
> dark apron stands still for a moment at the pass, hands resting on the
> steel, with the brigade cleaning down behind them. Warm amber light from the
> kitchen, cool blue from tall windows onto a city at night. A sense of mastery
> and calm after the storm. Landscape 1536×1024, subject in the central band,
> darker quiet lower-left. No text anywhere.

### 1.2 `milestone-victory-solicitor-v1.png`
> The senior partner's office of a respected law firm, late evening. A
> solicitor in a well-cut dark suit stands at a tall window, seen from behind
> and slightly to the side, looking out over a rain-washed city at dusk. Behind
> them: a long table with neatly closed case files tied with ribbon, a desk
> lamp still on, shelves of bound law reports with no readable spines.
> The feeling of a long career of cases won. Warm lamp light against cool
> window light. Landscape 1536×1024, subject in the central band, darker quiet
> lower-left. No text anywhere.

### 1.3 `milestone-victory-founder-v1.png`
> A bright, spacious company headquarters after hours. A wide open-plan floor
> with many empty desks and monitors glowing with soft abstract shapes (no
> readable interface). The founder, in a casual jacket, stands alone at the
> far end by floor-to-ceiling windows overlooking a city at blue hour, seen
> from behind. A few remaining team members chat quietly in the middle
> distance. It once fitted in one room; now it fills a floor. Cool blue light
> with warm pools from pendant lamps. Landscape 1536×1024, subject in the
> central band, darker quiet lower-left. No text, no logos on walls or screens.

### 1.4 `milestone-victory-politician-v1.png`
> A grand, old government building at night: a long, high-ceilinged corridor
> with stone floors and tall arched windows. A minister in a dark suit walks
> away from the camera down the corridor, carrying a battered dark leather
> document box, flanked at a distance by two aides. Pools of warm light from
> wall lamps, cool blue moonlight through the windows. Dignified, slightly
> lonely, earned. Landscape 1536×1024, subject in the central band, darker
> quiet lower-left. No flags with readable symbols, no text, no real building.

### 1.5 `milestone-victory-architect-v1.png`
> A striking, finished civic building at dusk, clearly the work of one
> architect: bold, elegant concrete and glass massing, warmly lit from within,
> people arriving across a wide plaza. In the foreground, slightly off-centre,
> the architect stands with their back to the camera, a rolled set of drawings
> under one arm, looking up at the building. Deep blue sky, warm interior
> glow, wet paving reflecting the light. Landscape 1536×1024, building and
> architect in the central band, darker quiet lower-left. No signage or
> lettering on the building.

### 1.6 `milestone-victory-engineer-v1.png`
> A large, clean, modern engineering works at the end of a shift. A long
> assembly hall with a finished precision machine on a test stand in the
> centre, lit by a warm overhead work light. Rows of further units recede into
> the cool blue gloom behind. The engineer, in a work jacket with safety
> glasses pushed up, stands beside the machine with one hand resting on it,
> seen in three-quarter view from behind. A sense of a product line that
> works and is trusted. Landscape 1536×1024, subject in the central band,
> darker quiet lower-left. No brand names, no warning labels with text.

---

## Batch 2: Screens with no picture

Two career screens have a banner slot but no image. They currently render
without one.

**Where it shows:** a banner across the top of the screen, cropped to a 3:1
strip from the middle of the image.

**Upload as references:** the other pictures for the same career, e.g.
`art-source/visuals/careers/politician-polling-v1.png` and
`politician-office-v1.png` for the Politician, and
`art-source/visuals/careers/founder-runway-v1.png` and `founder-team-v1.png`
for the Founder.

**Save to:** `art-source/visuals/careers/`

### 2.1 `politician-postbag-v1.png`: the Politician's "Postbag" screen
> A cramped constituency office on a weekday evening. A long trestle table
> covered with opened envelopes, handwritten letters and case folders (all
> illegible). A politician in shirtsleeves sits listening to an older
> constituent across the table. In the background, two volunteers at a second
> table stuff leaflets into envelopes and a third makes a phone call. A
> corkboard of blurred notes on the wall, a kettle and mugs on a filing
> cabinet. Warm desk-lamp light, cool streetlight through a rain-streaked
> shopfront window. Community, patience, unglamorous work. Landscape
> 1536×1024, subject in the central band. No readable text on anything.

### 2.2 `founder-product-v1.png`: the Founder's "Product" screen
> A small start-up team gathered around one large monitor in a converted
> warehouse office at night, looking at an abstract, glowing product dashboard
> made of soft coloured shapes and curves (no readable text or numbers). One
> person points at the screen; another types on a laptop; a third leans back
> with a takeaway coffee. A whiteboard behind them is covered in blurred
> diagrams. Exposed brick, a string of warm bulbs, cool blue light from the
> screens. The feeling of a product being shaped by what users do. Landscape
> 1536×1024, subject in the central band. No logos, no readable screens.

---

## Batch 3: Events for the four newer careers

When an event happens, the game shows a dialog. The Physician's events and
the Chef's critic have a picture in that dialog; the 16 events of the four
newer careers have none.

**Where it shows:** the top of the event dialog, cropped to a 21:9 strip,
with a short category label (in real HTML) over the bottom-left.

**Upload as references:** for the Founder, `founder-raising-v1.png`; for the
Politician, `politician-electorate-v1.png`; for the Architect,
`architect-studio-v1.png`; for the Engineer, `engineer-bench-v1.png`. All
are in `art-source/visuals/careers/`.

**Save to:** `art-source/visuals/events/`

The *category* column is the label the game will show over the image. It is
for the coding AI and isn't part of the prompt.

### Founder

| File | Event | Category |
| --- | --- | --- |
| `event-founder-acquihire-v1.png` | Somebody wants to buy the team | Acquisition |
| `event-founder-cloudbill-v1.png` | The infrastructure bill | Infrastructure |
| `event-founder-enterprise-v1.png` | One customer wants something built | Customers |
| `event-founder-bridge-v1.png` | A bridge, on their terms | Funding |

> **event-founder-acquihire:** A glass-walled meeting room in a large,
> polished tech company. Two well-dressed executives sit relaxed on one side of
> the table; across from them a small start-up team of four sits close
> together, uncertain, glancing at one another. A single sheet of paper (no
> readable text) lies in the middle of the table. Cool corporate light, city
> at dusk beyond the glass. Landscape 1536×1024, subject in the central band.
> No text, no logos.

> **event-founder-cloudbill:** Late at night in a small start-up office, a
> founder sits alone at a desk, face lit from below by a laptop showing an
> abstract bar chart that spikes sharply upward (no readable numbers). Behind
> them, through a glass wall, a narrow server cabinet glows with blinking
> blue status lights. Cold blue light, one warm desk lamp, an untouched dinner
> in a takeaway box. Landscape 1536×1024, subject in the central band. No text.

> **event-founder-enterprise:** A formal boardroom in a large corporate
> headquarters. A row of procurement managers in suits sit along one side of a
> long table with thick bound requirement documents (illegible) stacked in
> front of them. At the far end, two young founders in casual clothes present
> from a laptop, small in the big room. Cool daylight from tall windows,
> polished wood, a sense of scale and pressure. Landscape 1536×1024, subject in
> the central band. No text, no logos.

> **event-founder-bridge:** A quiet, expensive private members' club lounge in
> the evening. An older investor in a tailored jacket leans back in a leather
> armchair, relaxed, holding a glass. Opposite, a tired young founder sits on
> the edge of their chair with a laptop bag at their feet. A low table between
> them with a single folded document (illegible). Warm amber lamps, dark wood,
> an imbalance of power. Landscape 1536×1024, subject in the central band. No text.

### Politician

| File | Event | Category |
| --- | --- | --- |
| `event-pol-whip-v1.png` | The party wants your vote | The party |
| `event-pol-crisis-v1.png` | The water came in on Grange Road | The ward |
| `event-pol-donor-v1.png` | An offer of help | Money |
| `event-pol-defection-v1.png` | Somebody wants to come over | The party |

> **event-pol-whip:** A narrow, wood-panelled corridor in an old
> parliamentary building. A stern party whip in a dark suit stands close to a
> younger politician, speaking quietly, one hand raised as if making a point.
> The younger politician holds a folder against their chest. Other members
> pass at a distance, out of focus. Warm wall-lamp light, deep shadows,
> pressure and discretion. Landscape 1536×1024, subjects in the central band.
> No text, no flags.

> **event-pol-crisis:** Early morning on a flooded residential street of
> terraced houses. Brown floodwater up to the doorsteps, sandbags, residents
> carrying belongings out to the pavement, a council van with its lights on in
> the distance. A politician in wellington boots and a rain jacket stands
> knee-deep, listening to a distraught resident. Grey, cold dawn light,
> reflections in the water. Landscape 1536×1024, subjects in the central band.
> No readable text on vans or signs.

> **event-pol-donor:** A smart restaurant table for two at lunchtime, by a
> window. A confident property developer in an expensive open-collar shirt
> slides an envelope (blank, no text) across the white tablecloth toward a
> politician, who hasn't touched it. Through the window: a fenced empty
> building site. Warm interior light, cool daylight outside, an uneasy calm.
> Landscape 1536×1024, subjects in the central band. No text.

> **event-pol-defection:** The back room of a local pub after closing. Two
> politicians, one older and weathered, one younger, sit at a corner table
> with two half-finished drinks, talking quietly. The older one has a cardboard
> box of files (illegible) and a coat on the bench beside them. Warm, low
> light, dark wood, an air of a secret deal. Landscape 1536×1024, subjects in
> the central band. No text, no pub signage.

### Architect

| File | Event | Category |
| --- | --- | --- |
| `event-arch-value-v1.png` | The contractor has priced an alternative | Cost |
| `event-arch-planning-v1.png` | Refused | Planning |
| `event-arch-publication-v1.png` | A magazine wants to publish it | Press |
| `event-arch-spouse-v1.png` | The client's partner has seen the drawings | Client |

> **event-arch-value:** A building-site cabin office. On the table, two
> cladding samples side by side: one beautiful, textured and expensive-looking;
> one flat, cheap and plastic-looking. A contractor in a hi-vis vest taps the
> cheaper one; an architect in a dark coat stares at it, unconvinced. Rolled
> drawings and hard hats on the table. Grey daylight through a small window,
> one warm strip light. Landscape 1536×1024, subjects in the central band. No
> text, no logos on vests.

> **event-arch-planning:** A dim council planning office corridor. An
> architect sits alone on a bench, holding a single letter (illegible) loosely
> in one hand, an architectural model of a bold building on the seat beside
> them. Long fluorescent-lit corridor stretching away, closed office doors.
> Muted, cold, disappointed. Landscape 1536×1024, subject in the central band.
> No readable text, no signage.

> **event-arch-publication:** A photographer with a professional camera on a
> tripod shoots the interior of a beautiful modern house at golden hour: long
> concrete and timber living space, light streaming across the floor. An
> architect stands just out of the shot, watching anxiously, with a laptop open
> on a stool. Warm, flattering light, a moment of pride. Landscape 1536×1024,
> subjects in the central band. No text.

> **event-arch-spouse:** An evening kitchen in a family home. A large set of
> architectural plans is unrolled across the kitchen table, held down by mugs
> and a fruit bowl. A client's partner, who wasn't at the meetings, leans over
> the plans with a pen, frowning and pointing at the staircase. The client
> stands behind with arms folded, caught in between. Warm domestic pendant
> light, darkness outside the window. Landscape 1536×1024, subjects in the
> central band. No readable text on the plans.

### Engineer

| File | Event | Category |
| --- | --- | --- |
| `event-eng-odd-v1.png` | Something odd from a customer | Quality |
| `event-eng-cheaper-v1.png` | A cheaper component | Supply chain |
| `event-eng-standard-v1.png` | The standard has been revised | Regulation |
| `event-eng-rush-v1.png` | A large order, if it ships in a fortnight | Orders |

> **event-eng-odd:** Close and focused: an engineer at a workbench examines a
> worn, discoloured metal mechanical part under a magnifying lamp, turning it
> in gloved fingers. Beside it, a new identical part for comparison and a
> phone face-down. Workshop softly out of focus behind. A single warm
> work-lamp, everything else in cool shadow. Suspicion and concentration.
> Landscape 1536×1024, subject in the central band. No text.

> **event-eng-cheaper:** On a steel workbench, two precision ball bearings sit
> side by side on a cloth. One is in a premium-looking box, the other in a
> plain bag. Neither shows any text. An engineer leans in with a digital
> caliper measuring the cheaper one, a supplier's sales rep visible behind,
> slightly out of focus. Cool workshop light, one warm lamp. Doubt.
> Landscape 1536×1024, subject in the central band. No text or labels.

> **event-eng-standard:** A small engineering office at night. An engineer
> sits at a desk with a thick bound technical standard open (illegible pages),
> a printed technical drawing beside it covered in red pen circles, and a
> half-built prototype on the shelf behind. Head in one hand, pen in the other.
> Desk lamp pool of warm light, the rest in blue shadow. Landscape 1536×1024,
> subject in the central band. No readable text.

> **event-eng-rush:** A loading dock at a busy workshop, early morning. A
> lorry backed up to the dock, empty pallets, a forklift waiting. A small team
> of engineers and workers stand around a single crate, looking at the empty
> trailer and then at each other. Cold dawn light, warm light from inside the
> workshop, breath visible in the air. Urgency and doubt. Landscape 1536×1024,
> subjects in the central band. No text on the lorry or crates.

---

## Later batches (not written yet)

These are real gaps, but each needs scoping before prompts are written. Ask
the coding AI to look into them first:

- **Portraits for the newer careers' casts.** Only the Physician's characters
  have faces (`art-source/visuals/characters/`). Other careers' contacts show
  initials. The names are in `lib/game/phone/packs.ts` and the career cast files (e.g. `lib/game/careers/lawyerCast.ts`).
  Portraits are square and need a tighter facial style than the scenes.
- **Event art for the Chef and the Solicitor.** The Chef has 13 events and only
  the critic has a picture.
- **A city picture for the other careers' start screens.** The 14 city images
  all show a hospital, and only the Physician's network screen uses them.

---

## For the coding AI, after the images land

Do this on a branch, and read [`COMMUNICATION.md`](COMMUNICATION.md) first.

1. **Register the masters with the build script.** Add each new filename to
   `CAREER_ART_FILES` in `scripts/build-purchase-art.ts`. That script only
   converts files it lists. Run `npm run build:art`. It writes 720px and 1200px
   WebPs into `public/visuals/<group>/` and records their sizes in
   `lib/ui/purchaseArt.generated.ts`.
2. **Wire each batch in:**
   - **Batch 1 (victory):** `components/Outcome.tsx` uses the single
     `MILESTONE_VISUAL` for every career. Replace it with a per-career lookup
     (keyed by career id: `doctor`, `chef`, `lawyer`, `founder`, `politician`,
     `architect`, `engineer`). The Physician keeps
     `milestone-hospital-victory`. Use the `@2x` file, since the frame is
     672px wide.
   - **Batch 2 (screens):** add `constituents: scene("careers",
     "politician-postbag", …)` and `product: scene("careers",
     "founder-product", …)` to `CAREER_SCREEN_ART` in
     `lib/ui/careerSceneArt.ts`. The keys are the screen ids in
     `lib/ui/navigation.ts`.
   - **Batch 3 (events):** add one entry per event to `EVENT_VISUALS` in
     `lib/ui/visuals.ts`, keyed by the event id (`founder_acquihire`,
     `pol_crisis` and so on), with the category from the tables above.
     Decorative images get `alt: ""`. Set `focus` so the subject survives the
     21:9 crop.
3. **Look at every image in the game** at 375px and desktop width. Check
   that the crop keeps the subject and that the overlaid text stays readable.
4. **Run the gates:** `npm run typecheck`, `npm run lint`, `npm run check`,
   `npm run build`, and the browser tests.
5. **Log it** in `COMMUNICATION.md`.
