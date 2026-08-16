import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SAVE_KEY = "career-tycoon:save:v11";
const LEGACY_SAVE_KEY = "career-tycoon:save:v8";

/**
 * Preload a deterministic save. The fixtures are produced by the real engine
 * (`npm run fixtures`), so they always satisfy the save validator — a
 * hand-written literal would drift from the contract and let these tests pass
 * against a broken app.
 *
 * This is also why there is no debug hatch in the application: the game needs
 * no test-only controls when its own save format is the seam.
 */
async function preload(page: Page, fixture: string) {
  const save = readFileSync(join("e2e", "fixtures", `${fixture}.json`), "utf8");
  /*
   * Written ONCE, then reloaded — not via addInitScript, which re-runs on
   * every navigation and would silently restore the fixture behind any test
   * that reloads the page. That is exactly the bug that made the
   * "a finished run is not resumable" test pass a save back to itself.
   */
  await page.goto("/");
  await page.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [SAVE_KEY, save] as const,
  );
  await page.reload();
}

/**
 * The week number the INTERFACE is showing — read from the status strip, not
 * from storage, so these tests fail if the display stops tracking the run.
 */
async function readWeek(page: Page): Promise<number> {
  const label = await page
    .locator('dd[aria-label^="Week:"]')
    .first()
    .getAttribute("aria-label");
  const hit = label?.match(/Week:\s*(\d+)/);
  if (!hit) throw new Error(`could not read the week from "${label}"`);
  return Number(hit[1]);
}

/**
 * Close the weekly review. Escape only works on a quiet week — a week
 * carrying a decision has to be answered — so the Continue button is the
 * reliable path and Escape is the fallback.
 */
async function dismissReview(page: Page) {
  const review = page.getByRole("dialog");
  if (!(await review.isVisible().catch(() => false))) return;

  const cont = review.getByRole("button", { name: /^Continue$/ });
  if ((await cont.count()) > 0) {
    await cont.click();
  } else {
    await page.keyboard.press("Escape");
    // A week carrying an event has no Continue and refuses Escape: it is a
    // decision, and the only way past it is to answer.
    if (await review.isVisible().catch(() => false)) {
      await review.getByRole("button").last().click();
    }
  }
  await expect(review).toBeHidden();
}

/**
 * The three public-standing numbers, as the phone reports them. Rendered as a
 * definition list, so the text runs "Followers90reach" — hence matching the
 * label and taking the digits that follow it.
 */
async function readSocial(phone: ReturnType<Page["getByRole"]>) {
  const text = (await phone.textContent()) ?? "";
  const read = (label: string) =>
    text.match(new RegExp(`${label}\\s*([\\d,]+)`, "i"))?.[1] ?? "?";
  return `${read("Followers")}/${read("Trust")}/${read("Sentiment")}`;
}

/**
 * The commit control. Mobile has the sticky CommitBar; desktop has the inline
 * button in the forecast card, and only one of the two is ever in the DOM.
 */
const commitButton = (page: Page) =>
  page
    .getByRole("button", {
      // Anchored: the guidance panel has buttons like "Assign rest" that a
      // looser pattern happily matches.
      name: /^Commit week|^Assign time$|^Assign your time first$/,
    })
    .first();

/** Fill the week with one action and commit it. */
async function playWeek(page: Page, action = "Rest") {
  const plus = page.getByRole("button", {
    name: new RegExp(`More blocks on ${action}`, "i"),
  });
  for (let i = 0; i < 4; i++) {
    if (await plus.isEnabled()) await plus.click();
  }
  await commitButton(page).click();
}

/**
 * These cover the things a headless assertion suite cannot see: where the map
 * is actually scrolled to, where focus lands, whether the page overflows, and
 * what the browser complains about. Game rules are tested in `npm run check`.
 */

/** Fail on anything the browser considers a problem, including Next's own warnings. */
function watchConsole(page: Page) {
  const problems: string[] = [];
  const onMessage = (m: ConsoleMessage) => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    const text = m.text();
    // React DevTools nag is informational and not something the app controls.
    if (text.includes("Download the React DevTools")) return;
    problems.push(`${m.type()}: ${text}`);
  };
  page.on("console", onMessage);
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

/**
 * A fresh run, every time — no save carried between tests.
 *
 * Names are matched case-insensitively throughout: the interface upper-cases
 * labels with CSS, which does not reach the accessible name, so "PHYSICIAN"
 * on screen is "Physician" to a screen reader and to Playwright.
 */
async function startRun(page: Page) {
  // Cleared once rather than on every navigation, so a later reload keeps
  // whatever the run has since written. See the note in `preload`.
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  // The career card arms on the first press and starts the run on the second,
  // so the detail is readable before committing on a phone.
  const card = page.getByRole("button", { name: /physician/i });
  await card.click();
  await expect(card, "card shows as selected before it starts").toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await card.click();
  await expect(page.getByRole("button", { name: /^network$/i })).toBeVisible();
}

const mapGroup = (page: Page) => page.getByRole("group", { name: /World map/ });

async function openNetwork(page: Page) {
  await page.getByRole("button", { name: /^network$/i }).click();
  await expect(mapGroup(page)).toBeVisible();
}

/** Nothing anywhere in the app may make the page itself scroll sideways. */
async function expectNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, "page-level horizontal overflow").toBeLessThanOrEqual(0);
}

test.describe("network map", () => {
  test("opens with the home city on screen", async ({ page }) => {
    const problems = watchConsole(page);
    await startRun(page);
    await openNetwork(page);

    const home = mapGroup(page).getByRole("button", { name: /you are here/ });
    await expect(home).toBeVisible();
    await expect(home).toHaveAccessibleName(/^Lyon/);

    // Visible is not enough: it must be inside the scroller's own window,
    // which is the bug this guards — the map used to open showing the
    // Americas with Lyon off to the east.
    const inView = await home.evaluate((el) => {
      const box = el.closest("[role=group]")!.getBoundingClientRect();
      const marker = el.getBoundingClientRect();
      return marker.left >= box.left - 1 && marker.right <= box.right + 1;
    });
    expect(inView, "home city inside the map viewport").toBe(true);

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("selecting a city centres it and updates the detail panel", async ({
    page,
  }) => {
    await startRun(page);
    await openNetwork(page);

    const scroller = mapGroup(page);
    const before = await scroller.evaluate((el) => el.scrollLeft);

    await page
      .getByRole("navigation", { name: /cities/i })
      .getByRole("button", { name: /Tokyo/ })
      .click();

    // The detail panel follows the selection without a page change.
    await expect(
      page.getByRole("region", { name: /^Selected city/ }),
    ).toHaveAccessibleName("Selected city: Tokyo");

    const after = await scroller.evaluate((el) => el.scrollLeft);
    const pannable = await scroller.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1,
    );
    if (pannable) {
      expect(after, "map panned towards Tokyo").toBeGreaterThan(before);
    }

    const tokyoInView = await scroller
      .getByRole("button", { name: /^Tokyo/ })
      .evaluate((el) => {
        const box = el.closest("[role=group]")!.getBoundingClientRect();
        const marker = el.getBoundingClientRect();
        return marker.left >= box.left - 1 && marker.right <= box.right + 1;
      });
    expect(tokyoInView, "Tokyo inside the map viewport").toBe(true);
  });

  test("every city is present and reachable by keyboard", async ({ page }) => {
    await startRun(page);
    await openNetwork(page);

    const cities = [
      "Lyon",
      "Madrid",
      "Milan",
      "Berlin",
      "Amsterdam",
      "Paris",
      "London",
      "Dubai",
      "Singapore",
      "Tokyo",
      "New York",
      "São Paulo",
      "Mumbai",
      "Lagos",
    ];

    /*
     * The map clusters overlapping markets, so it does NOT show fourteen
     * markers at 1x — that is the feature. What must always hold is that
     * every city is reachable, and the navigator is the guarantee: it lists
     * all fourteen at every zoom, which is why it exists.
     */
    const navigator = page.getByRole("navigation", { name: /cities/i });
    for (const city of cities) {
      const chip = navigator.getByRole("button", {
        name: new RegExp(city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      });
      await expect(chip, `${city} in the navigator`).toHaveCount(1);
      await chip.focus();
      await expect(chip, `${city} can hold focus`).toBeFocused();
    }

    // Nothing on the map may be unaccounted for: every button is either a
    // city or a cluster that names its members.
    const markers = mapGroup(page).getByRole("button");
    const count = await markers.count();
    expect(count, "map shows markers").toBeGreaterThan(0);
    expect(count, "clustering reduces the marker count").toBeLessThan(14);

    let covered = 0;
    for (let i = 0; i < count; i++) {
      const name = (await markers.nth(i).getAttribute("aria-label")) ?? "";
      covered += cities.filter((c) => name.includes(c)).length;
    }
    expect(
      covered,
      "every city is named by some marker",
    ).toBeGreaterThanOrEqual(cities.length);
  });

  test("zooming in separates every city onto its own marker", async ({
    page,
  }) => {
    await startRun(page);
    await openNetwork(page);

    const zoomIn = page.getByRole("button", { name: /^Zoom in$/ });
    for (let i = 0; i < 12 && (await zoomIn.isEnabled()); i++) {
      await zoomIn.click();
    }

    // At full zoom nothing is grouped: fourteen cities, fourteen markers.
    await expect(mapGroup(page).getByRole("button")).toHaveCount(14);
    for (const city of ["London", "Paris", "Amsterdam", "Berlin", "Milan"]) {
      await expect(
        mapGroup(page).getByRole("button", { name: new RegExp(`^${city}\\.`) }),
        `${city} has its own marker when zoomed`,
      ).toHaveCount(1);
    }
  });

  test("reduced motion stops the decorative animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await startRun(page);
    await openNetwork(page);

    // Routes must still be drawn as solid lines, not left mid-dash.
    const routes = page.locator("svg path.route-flow, svg path.route-draw");
    for (let i = 0; i < (await routes.count()); i++) {
      const style = await routes.nth(i).evaluate((el) => {
        const s = getComputedStyle(el);
        return { name: s.animationName, dash: s.strokeDasharray };
      });
      expect(style.name, "route animation").toBe("none");
      expect(["none", ""], "route dash pattern").toContain(style.dash);
    }

    /*
     * The map is still fully usable under reduced motion.
     *
     * Selection goes through the navigator rather than by clicking the marker
     * directly, because on a phone the board is 1180px inside a ~350px window
     * and Tokyo is simply panned off-screen — that is what panning means, and
     * the navigator is the path the interface points at for exactly this. The
     * assertion is stronger than a click: the panel must update AND the map
     * must bring the city into its own viewport.
     */
    await expect(mapGroup(page).getByRole("button").first()).toBeVisible();
    await page
      .getByRole("navigation", { name: /cities/i })
      .getByRole("button", { name: /Tokyo/ })
      .click();
    await expect(
      page.getByRole("region", { name: /^Selected city/ }),
    ).toHaveAccessibleName("Selected city: Tokyo");

    const inView = await mapGroup(page)
      .getByRole("button", { name: /^Tokyo\./ })
      .evaluate((el) => {
        const box = el.closest("[role=group]")!.getBoundingClientRect();
        const marker = el.getBoundingClientRect();
        return marker.left >= box.left - 1 && marker.right <= box.right + 1;
      });
    expect(inView, "reduced motion still centres the selected city").toBe(true);
  });

  test("every label on the map has a marker under it", async ({ page }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await openNetwork(page);

    /*
     * The regression: labels were drawn for all fourteen cities while
     * clustering meant only some had their own marker, so Berlin's name sat
     * over open water with nothing beneath it.
     */
    const check = async () => {
      const labels = await mapGroup(page).locator("svg text").allTextContents();
      const names = await mapGroup(page)
        .getByRole("button")
        .evaluateAll((els) =>
          els.map((e) => e.getAttribute("aria-label") ?? ""),
        );
      for (const label of labels) {
        const backed = names.some(
          (n) => n.startsWith(`${label}.`) && !/markets:/.test(n),
        );
        expect(backed, `"${label}" has its own marker`).toBe(true);
      }
      return labels.length;
    };

    expect(await check(), "some cities are labelled").toBeGreaterThan(0);

    // And it must still hold once zoom dissolves the clusters.
    const zoomIn = page.getByRole("button", { name: /^Zoom in$/ });
    for (let i = 0; i < 12 && (await zoomIn.isEnabled()); i++) {
      await zoomIn.click();
    }
    expect(await check(), "more cities labelled when zoomed").toBeGreaterThan(
      0,
    );
  });

  test("zoom is bounded and reset returns to the home city", async ({
    page,
  }) => {
    await startRun(page);
    await openNetwork(page);

    const scroller = mapGroup(page);
    const board = scroller.locator("> div").first();
    const widthOf = () =>
      board.evaluate((el) => el.getBoundingClientRect().width);

    const start = await widthOf();
    const zoomIn = page.getByRole("button", { name: /^Zoom in$/ });
    const zoomOut = page.getByRole("button", { name: /^Zoom out$/ });
    const reset = page.getByRole("button", { name: /Reset the map/ });

    // Out is already at the floor on first render.
    await expect(zoomOut).toBeDisabled();

    await zoomIn.click();
    expect(await widthOf(), "zooming in enlarges the board").toBeGreaterThan(
      start,
    );
    await expect(zoomOut).toBeEnabled();

    // Walk to the top end: it must clamp, not run away. Bounded, and it stops
    // as soon as the control disables itself — which is the thing under test.
    for (let i = 0; i < 10 && (await zoomIn.isEnabled()); i++) {
      await zoomIn.click();
    }
    await expect(zoomIn).toBeDisabled();
    const maxWidth = await widthOf();
    /*
     * The ceiling is 6x. It is that high on purpose: the map uses real
     * geography, which puts London and Paris ~14px apart at 1x, and zoom is
     * how that crowding is resolved. The assertion is that it *stops* — a
     * clamp, not a limit on ambition.
     */
    expect(maxWidth / start, "zoom is clamped").toBeLessThanOrEqual(6.1);
    expect(maxWidth / start, "zoom reaches its ceiling").toBeGreaterThan(5);

    // Reset restores both the zoom and the selection.
    await page
      .getByRole("navigation", { name: /cities/i })
      .getByRole("button", { name: /Tokyo/ })
      .click();
    await reset.click();
    expect(await widthOf(), "reset restores the default zoom").toBeCloseTo(
      start,
      0,
    );
    await expect(
      page.getByRole("region", { name: /^Selected city/ }),
    ).toHaveAccessibleName("Selected city: Lyon");

    const homeInView = await scroller
      .getByRole("button", { name: /you are here/ })
      .evaluate((el) => {
        const box = el.closest("[role=group]")!.getBoundingClientRect();
        const marker = el.getBoundingClientRect();
        return marker.left >= box.left - 1 && marker.right <= box.right + 1;
      });
    expect(homeInView, "reset brings the home city back into view").toBe(true);
  });

  test("marker treatment tracks real state", async ({ page }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await openNetwork(page);

    // The midrun fixture operates in Lyon and Madrid and nowhere else.
    await expect(
      mapGroup(page).getByRole("button", { name: /^Lyon\..*you are here/ }),
    ).toHaveCount(1);
    await expect(
      mapGroup(page).getByRole("button", { name: /^Madrid\..*operating/ }),
    ).toHaveCount(1);
    await expect(
      mapGroup(page).getByRole("button", { name: /^Tokyo\..*not licensed/ }),
    ).toHaveCount(1);

    // Routes exist only between operating cities: one non-home operating
    // city means exactly one route.
    const routes = page.locator("svg path.route-flow, svg path.route-draw");
    await expect(routes).toHaveCount(1);
  });

  test("no page overflow at any tested width", async ({ page }) => {
    await startRun(page);
    await openNetwork(page);
    for (const size of [
      { width: 375, height: 812 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(size);
      await expectNoPageOverflow(page);
    }
  });
});

test.describe("phone", () => {
  test("opens, closes, and returns focus to its trigger", async ({ page }) => {
    const problems = watchConsole(page);
    await startRun(page);

    const trigger = page.getByRole("button", { name: /open phone/i });
    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expectNoPageOverflow(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger, "focus returned to the phone button").toBeFocused();

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });
});

test.describe("practice artwork", () => {
  test("renders without shifting the layout", async ({ page }) => {
    const problems = watchConsole(page);

    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          };
          if (!shift.hadRecentInput) {
            (window as unknown as { __cls: number }).__cls += shift.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    await startRun(page);
    await page.getByRole("button", { name: /^practice$/i }).click();

    const image = page.locator('img[src*="practice-progression"]');
    await expect(image).toBeVisible();
    // A priority image must not be lazy — that combination is what produced
    // the LCP warning in the first place.
    await expect(image).not.toHaveAttribute("loading", "lazy");

    await image.evaluate((el: HTMLImageElement) =>
      el.complete ? null : el.decode().catch(() => null),
    );

    const cls = await page.evaluate(
      () => (window as unknown as { __cls: number }).__cls,
    );
    expect(cls, "cumulative layout shift").toBeLessThan(0.1);

    // Next warns about LCP images that are not marked priority; none should
    // appear, and no image should fail to load.
    expect(problems.filter((p) => /Image|LCP|priority|sizes/i.test(p))).toEqual(
      [],
    );
    expect(problems).toEqual([]);
  });

  test("the heavy network texture is never requested", async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("healthcare-network-map")) requested.push(r.url());
    });

    await startRun(page);
    await page.getByRole("button", { name: /^network$/i }).click();
    await expect(mapGroup(page)).toBeVisible();

    expect(requested, "2.5MB map PNG must not be fetched").toEqual([]);
  });
});

test.describe("artwork", () => {
  test("career covers load and no source PNG is fetched", async ({ page }) => {
    const problems = watchConsole(page);
    const pngs: string[] = [];
    page.on("request", (r) => {
      const url = decodeURIComponent(r.url());
      if (/\/visuals\/.*\.png/.test(url)) pngs.push(url);
    });

    await page.addInitScript(() => window.localStorage.clear());
    await page.goto("/");

    // next/image rewrites src to a URL-encoded optimiser path, so match on
    // the filename stem rather than the directory separator.
    const covers = page.locator('main img[src*="career-"]');
    await expect(covers).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const ok = await covers
        .nth(i)
        .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
      expect(ok, `career cover ${i} decoded`).toBe(true);
    }

    expect(pngs, "heavy source PNGs must never be requested").toEqual([]);
    expect(problems).toEqual([]);
  });

  test("only the selected city's artwork is loaded", async ({ page }) => {
    const cityRequests: string[] = [];
    page.on("request", (r) => {
      const url = decodeURIComponent(r.url());
      const hit = url.match(/\/visuals\/cities\/(city-[a-z-]+)\.webp/);
      if (hit) cityRequests.push(hit[1]);
    });

    await startRun(page);
    await page.getByRole("button", { name: /^network$/i }).click();
    await expect(mapGroup(page)).toBeVisible();
    await page.waitForTimeout(500);

    // The map itself must never pull fourteen photographs.
    expect(
      new Set(cityRequests).size,
      "cities loaded on map open",
    ).toBeLessThanOrEqual(1);
    expect(cityRequests.every((c) => c === "city-lyon")).toBe(true);

    await page
      .getByRole("navigation", { name: /cities/i })
      .getByRole("button", { name: /Mumbai/ })
      .click();
    await expect(
      page.getByRole("region", { name: /^Selected city/ }),
    ).toHaveAccessibleName("Selected city: Mumbai");
    await expect(page.locator('img[src*="city-mumbai"]')).toHaveCount(1);
    expect(
      new Set(cityRequests).size,
      "one more city after selecting",
    ).toBeLessThanOrEqual(2);
  });

  test("the milestone image appears only for a won run", async ({ page }) => {
    await startRun(page);
    // A fresh run has not won anything, so nothing may claim it has.
    await expect(page.locator('img[src*="milestone"]')).toHaveCount(0);
  });

  test("every section banner resolves and none is a PNG", async ({ page }) => {
    const problems = watchConsole(page);
    const failed: string[] = [];
    const pngs: string[] = [];
    page.on("response", (r) => {
      const url = decodeURIComponent(r.url());
      if (/\/visuals\//.test(url) && r.status() >= 400) failed.push(url);
      if (/\/visuals\/.*\.png/.test(url)) pngs.push(url);
    });

    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    // Overview's hero is the above-the-fold one and must not be lazy.
    const hero = page.locator('img[src*="section-overview"]');
    await expect(hero).toHaveCount(1);
    await expect(hero).not.toHaveAttribute("loading", "lazy");

    // Walk the screens that carry a banner and confirm each one loads.
    const screens: [RegExp, string][] = [
      /* Loose, because a badge prepends a count to the label. */
      [/Career/, "section-career"],
      [/Life/, "section-life"],
    ];
    for (const [nav, stem] of screens) {
      /*
       * By visible text, not by exact accessible name.
       *
       * A section with an outstanding alert renders a badge, which prepends
       * "1 warning in Career" to the button's accessible name — so `^career$`
       * silently stopped matching the moment standing alerts started routing
       * to that section. The label the player reads is the stable handle.
       */
      await page
        .getByRole("navigation", { name: "Primary" })
        .last()
        .getByRole("button")
        .filter({ hasText: nav })
        .first()
        .click();
      const img = page.locator(`img[src*="${stem}"]`);
      await expect(img, `${stem} present`).toHaveCount(1);
      // Lazy by design, so poll rather than assuming it has already arrived.
      await expect
        .poll(
          () =>
            img.evaluate(
              (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
            ),
          { message: `${stem} decoded` },
        )
        .toBe(true);
    }

    expect(failed, "no visual returned an error status").toEqual([]);
    expect(pngs, "no PNG master is ever requested").toEqual([]);
    expect(problems).toEqual([]);
  });
});

/* ------------------------------------------------------- weekly gameplay */

test.describe("the weekly loop", () => {
  test("allocating, committing and closing a quiet week", async ({ page }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    const weekBefore = await readWeek(page);

    // Allocation is reflected before commit: the control refuses an empty
    // week and arms once time has been assigned.
    const commit = commitButton(page);
    await expect(commit).toBeDisabled();
    const plus = page.getByRole("button", { name: /More blocks on Rest/i });
    for (let i = 0; i < 4; i++) await plus.click();
    await expect(commit).toBeEnabled();
    await expect(commit).toHaveText(/Commit week/);

    await commit.click();

    // The review opens, and a quiet week can be dismissed with Escape.
    const review = page.getByRole("dialog");
    await expect(review).toBeVisible();
    await expect(review).toContainText(
      new RegExp(`week ${weekBefore} closed`, "i"),
    );
    await page.keyboard.press("Escape");
    await expect(review).toBeHidden();

    // The interface reflects the new week.
    expect(await readWeek(page)).toBe(weekBefore + 1);
    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("an event is presented and its choice resolves", async ({ page }) => {
    const problems = watchConsole(page);
    await preload(page, "before-event");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    const before = await readWeek(page);
    await playWeek(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // This fixture is seeded to the week an illustrated event fires.
    await expect(dialog).toContainText(/Regulatory inspection/i);
    await expect(dialog.locator("img")).toHaveCount(1);
    // The category and severity badges the registry supplies.
    await expect(dialog).toContainText(/Regulatory/);
    await expect(dialog).toContainText(/Serious/);

    // Escape must NOT dismiss a week carrying a decision.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();

    // Resolving the choice closes it; the week has already advanced on commit.
    await dialog.getByRole("button", { name: /Cooperate fully/i }).click();
    await expect(dialog).toBeHidden();
    expect(await readWeek(page)).toBe(before + 1);

    expect(problems).toEqual([]);
  });
});

/* ------------------------------------------------------ save and continue */

test.describe("continuing a run", () => {
  test("progress survives a reload", async ({ page }) => {
    await startRun(page);

    // Make progress that is visible and specific.
    await playWeek(page);
    await dismissReview(page);
    const week = await readWeek(page);
    expect(week).toBeGreaterThan(1);

    await page.reload();

    const cont = page.getByRole("button", { name: /continue your run/i });
    await expect(cont, "continue is offered after a reload").toBeVisible();
    await cont.click();

    expect(await readWeek(page), "the week survived the reload").toBe(week);
  });

  test("a run past the old goal is still resumable", async ({ page }) => {
    /*
     * This replaces "a finished run is not offered as continuable".
     *
     * That test asserted the opposite of the product rule — that reaching the
     * goal ends the run. Reaching the goal is now a milestone, so the correct
     * assertion is that the save is still there and still playable.
     */
    await preload(page, "nearly-won");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await playWeek(page);
    await dismissReview(page);

    const week = await readWeek(page);
    await page.reload();
    await expect(
      page.getByRole("button", { name: /continue your run/i }),
      "a successful run must still be resumable",
    ).toBeVisible();
    await page.getByRole("button", { name: /continue your run/i }).click();
    expect(await readWeek(page)).toBe(week);
  });
});

/* ------------------------------------------------- the sandbox guarantee */

test.describe("nothing ends the run", () => {
  test("reaching the old win condition keeps playing", async ({ page }) => {
    const problems = watchConsole(page);
    await preload(page, "nearly-won");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    const before = await readWeek(page);
    await playWeek(page);
    await dismissReview(page);

    // Still the game, not a results screen.
    expect(await readWeek(page)).toBe(before + 1);
    await expect(commitButton(page)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /run it again/i }),
      "no end-of-run screen may appear",
    ).toHaveCount(0);

    // And the achievement was recorded rather than consumed.
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Career/ })
      .first()
      .click();
    await page.getByRole("tab", { name: /timeline/i }).click();
    await expect(page.getByText(/hospital is yours/i)).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("falling into insolvency offers a way back, not a game over", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "nearly-lost");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await playWeek(page);
    await dismissReview(page);

    // The run continues.
    await expect(commitButton(page)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /run it again/i }),
    ).toHaveCount(0);

    // And the setback is on screen with its routes out.
    await expect(
      page.getByRole("heading", { name: /business failure/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/This does not end your career/i),
    ).toBeVisible();
    await expect(page.getByText(/The way back/i)).toBeVisible();
    expect(
      await page.getByRole("button", { name: /^Do this$|^Not yet$/ }).count(),
    ).toBeGreaterThan(2);

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });
});

/* --------------------------------------------------- character and retiring */

test.describe("who you are", () => {
  const openCharacter = async (page: Page) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Career/ })
      .first()
      .click();
    await page.getByRole("tab", { name: /character/i }).click();
  };

  test("personality is earned, not chosen", async ({ page }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await openCharacter(page);

    await expect(
      page.getByRole("heading", { name: /^Personality$/ }),
    ).toBeVisible();
    await expect(
      page.getByText(/earned by what you keep doing/i),
    ).toBeVisible();
    // No button anywhere that simply grants a trait.
    await expect(
      page.getByRole("button", {
        name: /become (ruthless|charismatic|ambitious)/i,
      }),
    ).toHaveCount(0);

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("an ambition can be chosen and does not end anything", async ({
    page,
  }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await openCharacter(page);

    await expect(page.getByText(/it is not a win condition/i)).toBeVisible();
    const pick = page
      .getByRole("button", { name: /make this the goal/i })
      .first();
    await pick.click();
    // Still playing.
    await expect(page.getByRole("tab", { name: /character/i })).toBeVisible();
  });

  test("retirement is opt-in, previewed, and cancellable", async ({ page }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    /* Read on Overview: the week lives in the status strip, which only that
       screen renders — querying for it anywhere else waits forever. */
    const week = await readWeek(page);

    await openCharacter(page);
    await expect(page.getByText(/Only you decide when/i)).toBeVisible();
    await page.getByRole("button", { name: /consider retiring/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/Nothing is written until/i);
    await expect(dialog).toContainText(/What this career was/i);

    // Cancelling must leave the run untouched and playable.
    await dialog.getByRole("button", { name: /keep going/i }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("tab", { name: /character/i })).toBeVisible();

    /* Reload rather than navigate: it proves the cancel wrote nothing to
       storage, which is the actual guarantee — and it avoids fighting the
       fixed bottom bar on a handset. */
    await page.reload();
    await page.getByRole("button", { name: /continue your run/i }).click();
    expect(await readWeek(page), "cancelling changes nothing").toBe(week);
    await openCharacter(page);

    // Escape cancels too — the destructive path must never be the default.
    await page.getByRole("button", { name: /consider retiring/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    expect(problems).toEqual([]);
  });
});

/* ------------------------------------------------------------- the phone */

test.describe("the phone", () => {
  test("posting once a week, and the refusal on the second", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "phone-ready");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    await page.getByRole("button", { name: /open phone/i }).click();
    const phone = page.getByRole("dialog");
    await expect(phone).toBeVisible();
    await expectNoPageOverflow(page);

    // The phone opens on Messages or News when either has unread items, so
    // reach Pulse explicitly rather than assuming it is the landing app.
    await phone.getByRole("button", { name: /^Pulse/i }).click();

    // The composer offers this week's eligible posts as chips; one is chosen,
    // then published. The fixture guarantees at least one is available.
    await expect(phone).toContainText(/Compose/i);
    const socialBefore = await readSocial(phone);
    const feedBefore = await phone.locator("ul > li").count();

    // It starts collapsed — by mid-run eleven eligible posts would otherwise
    // push the feed off a handset screen entirely.
    const composer = phone.getByRole("button", { name: /Compose · week/i });
    await expect(composer).toHaveAttribute("aria-expanded", "false");
    await expect(
      phone.getByRole("button", { name: /Write health advice/i }),
    ).toBeHidden();

    await composer.click();
    await expect(composer).toHaveAttribute("aria-expanded", "true");

    await phone.getByRole("button", { name: /Write health advice/i }).click();
    const publish = phone.getByRole("button", { name: /^Publish$/ });
    await expect(publish).toBeVisible();
    await publish.click();

    // It lands in the feed, attributed to the player, and moves the numbers.
    await expect
      .poll(async () => phone.locator("ul > li").count(), {
        message: "the post should appear in the feed",
      })
      .toBeGreaterThan(feedBefore);
    await expect(phone).toContainText("@you");
    await expect
      .poll(async () => readSocial(phone), {
        message: "followers, trust or sentiment should move after a post",
      })
      .not.toBe(socialBefore);

    // A second post in the same week is refused — the composer says so
    // rather than offering a button that silently does nothing.
    await expect(phone).toContainText(/already posted this week/i);
    await expect(phone.getByRole("button", { name: /^Publish$/ })).toHaveCount(
      0,
    );

    await page.keyboard.press("Escape");
    await expect(phone).toBeHidden();
    expect(problems).toEqual([]);
  });

  test("opening news and messages marks them read", async ({ page }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    const trigger = page.getByRole("button", { name: /open phone/i });
    const unreadBadge = await trigger.textContent();

    await trigger.click();
    const phone = page.getByRole("dialog");
    await expect(phone).toBeVisible();

    // Visit both inboxes; whichever carried unread items must clear.
    for (const app of [/news/i, /messages/i]) {
      const tab = phone.getByRole("button", { name: app }).first();
      if ((await tab.count()) > 0) await tab.click();
    }

    await page.keyboard.press("Escape");
    await expect(phone).toBeHidden();

    // The unread marker on the trigger must not have grown.
    const after = await trigger.textContent();
    expect((after ?? "").length).toBeLessThanOrEqual(
      (unreadBadge ?? "").length,
    );
  });
});

/* ------------------------------------------------------------- quick plan */

test.describe("filling the week in one tap", () => {
  test("a named plan spends the whole week and can still be edited", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    const commit = commitButton(page);
    await expect(commit).toBeDisabled();

    // One press fills the week, so the commit control arms without the six
    // separate stepper presses the board would otherwise need.
    await page.getByRole("button", { name: /^Balanced/ }).click();
    await expect(commit).toBeEnabled();
    await expect(commit).toHaveText(/Commit week/);

    // This fixture sits at burnout 81, so the plans that assign no rest carry
    // a warning — a one-tap button must not be able to quietly end the run.
    await expect(
      page.getByRole("button", { name: /Balanced.*no rest in it/i }),
      "a restless plan is marked while burnout is high",
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Recovery/ }),
      "the plan that does rest carries no warning",
    ).toBeVisible();

    // The steppers still govern: a plan is a starting point, not a lock.
    await page
      .getByRole("button", { name: /Fewer blocks on Rest|Fewer blocks on/i })
      .first()
      .click();
    await expect(commit).toBeEnabled();

    // And clearing empties it again rather than leaving a stale plan behind.
    await page.getByRole("button", { name: /^Clear$/ }).click();
    await expect(commit).toBeDisabled();

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("last week's plan is offered again after a reload", async ({ page }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    // Recover, not Grow: this fixture is at burnout 81, and a week with no
    // rest in it ends the run outright — which would leave nothing to resume.
    await page.getByRole("button", { name: /^Recovery/ }).click();
    await commitButton(page).click();
    await dismissReview(page);

    // The offer must survive the reload: most sittings begin by resuming, and
    // that is exactly when repeating last week is worth the most.
    await page.reload();
    await page.getByRole("button", { name: /continue your run/i }).click();
    const repeat = page.getByRole("button", { name: /repeat last week/i });
    await expect(repeat).toBeVisible();

    await repeat.click();
    await expect(commitButton(page)).toBeEnabled();
  });
});

/* --------------------------------------------------------------- outbreaks */

test.describe("outbreak pressure", () => {
  test("the odds the simulation rolls against are on screen", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Network/ })
      .first()
      .click();
    await page.getByRole("tab", { name: /outbreaks/i }).click();

    const strip = page.getByText(/Outbreak pressure/i).locator("..");
    await expect(strip).toBeVisible();
    // A real percentage and a real ceiling, not a vague mood word alone.
    await expect(strip).toContainText(/%\s*a week/i);
    await expect(page.getByText(/severity \d of 5/i)).toBeVisible();

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });
});

/* ------------------------------------------------------------------- shell */

test.describe("the app shell", () => {
  test("the bottom bar stays anchored at tablet width", async ({ page }) => {
    // 768 is the width the nav used to switch layout at while the shell was
    // still rendering the mobile instance — the bar detached from the bottom
    // and landed in the page flow.
    await page.setViewportSize({ width: 768, height: 1024 });
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    const bar = page.getByRole("navigation", { name: "Primary" }).last();
    await expect(bar).toBeVisible();
    await expect(bar).toHaveCSS("position", "fixed");

    const box = await bar.boundingBox();
    const height = page.viewportSize()?.height ?? 0;
    expect(box, "the primary nav should have a box").not.toBeNull();
    expect(
      Math.abs((box?.y ?? 0) + (box?.height ?? 0) - height),
      "the bar should sit on the bottom edge",
    ).toBeLessThanOrEqual(2);

    await expectNoPageOverflow(page);
  });
});

/* ---------------------------------------------------- the purchase screens */

test.describe("buying things", () => {
  test("a card states the gap instead of greying itself out", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Life/ })
      .first()
      .click();

    // The mid-run fixture cannot afford the country estate. The card must
    // still be fully readable and must say how far short it is — an
    // unaffordable item is something to save toward, not something broken.
    const estate = page.getByRole("article", { name: "Country estate" });
    await expect(estate).toContainText(/short/i);

    const opacity = await estate.evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity), "an unaffordable card is not dimmed").toBe(1);

    /*
     * The control is present and disabled rather than absent, so the layout
     * does not reflow as cash moves. Its label now states the reason —
     * "Not enough cash" — instead of saying "Buy" and refusing, which made
     * the player click it to find out why.
     */
    const buy = estate.getByRole("button", { name: /not enough cash/i });
    await expect(buy).toBeVisible();
    await expect(buy).toBeDisabled();

    // Something affordable in the same list is live.
    const town = page.getByRole("article", { name: "Town house" });
    await expect(town.getByRole("button", { name: /^Buy$/ })).toBeEnabled();

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("a purchase card is not itself a button", async ({ page }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Practice/ })
      .first()
      .click();

    // Practice used to wrap each card in a <button>, which gives a screen
    // reader an accessible name three sentences long. The name should now be
    // the verb alone.
    const buys = page.getByRole("button", { name: /^Buy$/ });
    expect(await buys.count()).toBeGreaterThan(0);
    for (const name of await buys.allTextContents()) {
      expect(
        name.trim().length,
        `"${name}" should be a short label`,
      ).toBeLessThan(12);
    }
  });

  test("buying a department opens it", async ({ page }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Practice/ })
      .first()
      .click();

    /* Departments became illustrated cards, so the control is the shelf's
       "Buy" rather than a bare "Open department" row. The guarantee is
       unchanged: opening one takes it off the list of things you can open. */
    await page.getByRole("tab", { name: /^build$/i }).click();
    /* Scoped to the department shelf by its own landmark: premises cards
       also mention departments in their headline ("room for 3 departments"),
       so a text filter would count those too. */
    const shelf = page.getByRole("region", { name: /^Departments ·/ });
    const offers = () => shelf.getByRole("button", { name: /^Buy$/ });
    const open = offers().first();
    await expect(open).toBeEnabled();
    const before = await offers().count();

    await open.click();

    // One fewer department is on offer, and the panel header agrees.
    await expect.poll(async () => offers().count()).toBe(before - 1);
    /* And the shelf header counts it. */
    await expect(shelf.getByText(/\d+ of \d+ owned/)).toBeVisible();
  });
});

/* ------------------------------------------------------------- old saves */

test.describe("an older save", () => {
  test("is migrated forward rather than discarded", async ({ page }) => {
    const problems = watchConsole(page);

    /*
     * A genuine v8 save: the current fixture with every field v9 added
     * stripped out, written under the old key. This is what a player who
     * last opened the game before this build has sitting in their browser,
     * and the promise is that it keeps working.
     */
    const raw = JSON.parse(
      readFileSync(join("e2e", "fixtures", "midrun.json"), "utf8"),
    );
    delete raw.people;
    delete raw.timeline;
    delete raw.pending;
    delete raw.repLog;
    for (const key of [
      "repPatients",
      "repLoyalty",
      "repInfluence",
      "repPopularity",
      "repEthics",
    ]) {
      delete raw.r[key];
    }
    // …and everything v10 added, so this is a genuine two-hop upgrade.
    for (const key of [
      "rivals",
      "offers",
      "contracts",
      "contractLog",
      "obligations",
      "news",
      "crises",
    ]) {
      delete raw[key];
    }
    const week = raw.week;

    await page.goto("/");
    await page.evaluate(
      ([key, value]) => {
        window.localStorage.clear();
        window.localStorage.setItem(key, value);
      },
      [LEGACY_SAVE_KEY, JSON.stringify(raw)] as const,
    );
    await page.reload();

    const cont = page.getByRole("button", { name: /continue your run/i });
    await expect(cont, "an older save is still offered").toBeVisible();
    await cont.click();

    // The run it actually was, not a fresh one.
    expect(await readWeek(page), "the week survived the upgrade").toBe(week);

    // And the new subsystems are present and usable.
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Career/ })
      .first()
      .click();
    await page.getByRole("tab", { name: /standing/i }).click();
    await expect(page.getByText(/Professional credibility/i)).toBeVisible();

    // The upgrade is written back once, under the current key.
    const keys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(keys, "the save is stored at the current version").toContain(
      "career-tycoon:save:v11",
    );
    expect(keys, "and the old key is cleaned up").not.toContain(
      "career-tycoon:save:v8",
    );

    expect(problems).toEqual([]);
  });
});

/* ------------------------------------------------- the phase 1 subsystems */

test.describe("standing, people and timeline", () => {
  const openCareerTab = async (page: Page, tab: RegExp) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Career/ })
      .first()
      .click();
    await page.getByRole("tab", { name: tab }).click();
  };

  test("standing shows six categories, each with why it moved", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await openCareerTab(page, /standing/i);

    for (const label of [
      /Professional credibility/i,
      /Patient trust/i,
      /Staff loyalty/i,
      /Industry influence/i,
      /Public popularity/i,
      /Ethical standing/i,
    ]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }

    // Not just bars: each one states what moves it.
    await expect(page.getByText(/Moved by:/).first()).toBeVisible();
    // And the meters are real meters, not decorative divs.
    expect(await page.getByRole("meter").count()).toBeGreaterThan(5);

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("people are characters that open, not rows of numbers", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await openCareerTab(page, /people/i);

    const person = page.getByRole("button", { name: /Iris Hallam/ });
    await expect(person).toBeVisible();
    await expect(person).toHaveAttribute("aria-expanded", "false");

    // Collapsed, the numbers are not on screen — that is the whole point of
    // leading with a person rather than a stat line.
    await expect(page.getByText(/^Respect$/)).toHaveCount(0);

    await person.click();
    await expect(person).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/^Respect$/).first()).toBeVisible();
    await expect(page.getByText(/supervising consultant/i)).toBeVisible();

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("the timeline records real milestones and nothing else", async ({
    page,
  }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await openCareerTab(page, /timeline/i);

    // The fixture hires a nurse and enters Madrid, so both must be recorded —
    // and the run's own beginning.
    await expect(page.getByText(/You qualified/)).toBeVisible();
    const entries = await page.locator("ol > li").count();
    expect(entries, "the timeline has the run's real moments").toBeGreaterThan(
      1,
    );

    // Every entry carries the week it happened.
    await expect(page.getByText(/^Week \d+$/).first()).toBeVisible();
  });
});

/* ------------------------------------------------------ phase 2 surfaces */

test.describe("the living world", () => {
  const goto = async (page: Page, section: RegExp, tab: RegExp) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: section })
      .first()
      .click();
    await page.getByRole("tab", { name: tab }).click();
  };

  test("rivals are visible, and open into a career", async ({ page }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await goto(page, /Network/, /rivals/i);

    /* Scoped to the panel. The shell header button is named "Physician Dr ·
       MD Back to career select", which a loose /Dr / matcher happily picks up
       and which has no aria-expanded to check — so an unscoped `.first()`
       was testing the header, not a rival. */
    const cards = page
      .getByRole("list", { name: "Rivals" })
      .getByRole("button");
    // Every rival resolves to a person: named cards, no blanks.
    expect(await cards.count()).toBeGreaterThanOrEqual(4);

    /* Held by index, not by state: filtering on `expanded: false` would
       re-resolve to a *different* card after the click. */
    const first = cards.nth(0);
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/^Standing$/).first()).toBeVisible();

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("the team screen explains its culture score", async ({ page }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await goto(page, /Practice/, /^team$/i);

    // Derived, and it shows its working rather than a bare number.
    await expect(page.getByRole("meter", { name: /culture/i })).toBeVisible();
    await expect(page.getByText(/Not something you buy/i)).toBeVisible();
    await expect(page.getByText(/Average load/i).first()).toBeVisible();

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("financing shows blocked routes with the reason", async ({ page }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await goto(page, /Practice/, /^money$/i);

    await expect(page.getByText(/You own/i).first()).toBeVisible();
    // All four external routes are present, offered or explained.
    for (const label of [
      /Bank facility/,
      /Outside investment/,
      /Clinical partner/,
      /Institutional grant/,
    ]) {
      await expect(page.getByRole("article", { name: label })).toBeVisible();
    }
    // At least one is blocked at week 4, and says why rather than vanishing.
    const blocked = page.getByText(
      /Nobody on the panel has heard of you|does not know you well enough/i,
    );
    expect(await blocked.count()).toBeGreaterThan(0);

    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("work is presented with its risk as well as its reward", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await goto(page, /Practice/, /^work$/i);

    await expect(
      page.getByRole("heading", { name: /On the table/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /What you are carrying/i }),
    ).toBeVisible();
    await expectNoPageOverflow(page);
    expect(problems).toEqual([]);
  });

  test("every new screen is reachable by keyboard alone", async ({ page }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    for (const [section, tab] of [
      [/Practice/, /^work$/i],
      [/Practice/, /^team$/i],
      [/Practice/, /^money$/i],
      [/Network/, /rivals/i],
    ] as const) {
      await goto(page, section, tab);
      // The tab that was activated reports itself as selected, which is what
      // a screen reader announces.
      await expect(page.getByRole("tab", { name: tab })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      // And it can be operated from the keyboard.
      await page.getByRole("tab", { name: tab }).focus();
      await expect(page.getByRole("tab", { name: tab })).toBeFocused();
    }
  });

  test("the new screens hold at mobile and desktop widths", async ({
    page,
  }) => {
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [section, tab] of [
        [/Practice/, /^team$/i],
        [/Practice/, /^money$/i],
        [/Network/, /rivals/i],
      ] as const) {
        await goto(page, section, tab);
        await expectNoPageOverflow(page);
      }
    }
  });
});

/* --------------------------------------------------------- comprehension */

/**
 * ORIENTATION
 *
 * Six questions a player should be able to answer without guessing: where am
 * I, what is happening, what needs attention, what can I do, why is that
 * locked, and what happens next. Each test below is one of them, asserted
 * against real run state rather than against static copy — a header that says
 * the same thing on every screen would pass a "header exists" test and fail
 * the player.
 */
test.describe("knowing where you are", () => {
  const nav = async (page: Page, section: RegExp, tab?: RegExp) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: section })
      .first()
      .click();
    if (tab) await page.getByRole("tab", { name: tab }).click();
  };

  test("every screen says where you are and what is true there", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    /*
     * Two screens in different sections, because the point is that the
     * status is derived rather than boilerplate: if both said the same
     * sentence the header would be decoration.
     */
    await nav(page, /Practice/, /^build$/i);
    const build = page.getByRole("main").getByRole("status").first();
    await expect(build).toBeVisible();
    const buildText = (await build.innerText()).trim();

    await nav(page, /Career/, /^standing$/i);
    const standing = page.getByRole("main").getByRole("status").first();
    await expect(standing).toBeVisible();
    const standingText = (await standing.innerText()).trim();

    expect(buildText.length).toBeGreaterThan(10);
    expect(
      standingText,
      "the status must reflect the screen, not repeat a banner",
    ).not.toBe(buildText);

    // And the breadcrumb names the section it belongs to.
    await expect(
      page
        .getByRole("main")
        .getByText(/Career/)
        .first(),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("contextual help is a real control, not a hover tooltip", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await nav(page, /Practice/, /^build$/i);

    const help = page
      .getByRole("main")
      .getByRole("button", { name: /^help/i })
      .first();
    await expect(help).toBeVisible();
    await expect(help).toHaveAttribute("aria-expanded", "false");

    /* Reachable and operable from the keyboard, which a title= tooltip is
       not — that is the whole reason this is a disclosure button. */
    await help.focus();
    await page.keyboard.press("Enter");
    await expect(help).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("main").getByRole("definition").first(),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("a locked purchase says why, in cash", async ({ page }) => {
    const problems = watchConsole(page);
    await startRun(page);
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Practice/ })
      .first()
      .click();
    await page.getByRole("tab", { name: /^build$/i }).click();

    /* A fresh run cannot afford most equipment, so at least one card must
       explain the gap rather than merely disabling its button.

       The wording moved with the purchase redesign — the card now prints the
       gap as "$12,400 short" beside the price rather than a sentence — so the
       assertion is on the guarantee, which is that the number is on the face
       of the card. */
    await expect(
      page.getByText(/\$[\d,]+ short/i).first(),
      "an unaffordable item must say how far short you are",
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("every purchase states what it costs now and every week", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await startRun(page);
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: /Practice/ })
      .first()
      .click();
    await page.getByRole("tab", { name: /^build$/i }).click();

    /*
     * Both prices, before the purchase is made.
     *
     * The card carries the one-off price and the recurring cost together;
     * the full labelled breakdown moved into the detail drawer when purchases
     * were redesigned around artwork. Both halves are asserted, because the
     * guarantee was never "these exact words" — it was that a player cannot
     * buy a thing without being shown what it costs to keep.
     */
    const card = page
      .getByRole("article")
      .filter({ hasText: /exam room/i })
      .first();
    await expect(card.getByText(/\/wk after/i)).toBeVisible();

    await card.getByRole("button", { name: /details/i }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText(/^price$/i)).toBeVisible();
    await expect(drawer.getByText(/every week afterwards/i)).toBeVisible();
    await expect(drawer.getByText(/upkeep/i).first()).toBeVisible();
    await page.keyboard.press("Escape");

    expect(problems).toEqual([]);
  });

  test("the weekly review explains what changed and why", async ({ page }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await playWeek(page);

    const review = page.getByRole("dialog");
    await expect(review).toBeVisible();
    /* The ledger was always there. What was missing was the cause — so this
       asserts on the grouped summary above it, not on the table. */
    await expect(
      review.getByRole("heading", { name: /the week/i }),
    ).toBeVisible();
    await expect(
      review.getByText(/referred elsewhere|brought in|took \$/i).first(),
      "each movement must carry its reason",
    ).toBeVisible();

    await dismissReview(page);
    expect(problems).toEqual([]);
  });

  test("nothing in the interface threatens to end the run", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    const banned = /ends the run|run ends|game over|of 156|before week 156/i;
    for (const [section, tab] of [
      [/Practice/, /^build$/i],
      [/Practice/, /^staff$/i],
      [/Career/, /^career$/i],
      [/Life/, undefined],
    ] as const) {
      await nav(page, section, tab);
      const text = await page.getByRole("main").innerText();
      expect(text, `ending language on ${section}`).not.toMatch(banned);
    }

    expect(problems).toEqual([]);
  });

  test("orientation survives a phone and a keyboard", async ({ page }) => {
    const problems = watchConsole(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    for (const [section, tab] of [
      [/Practice/, /^build$/i],
      [/Career/, /^standing$/i],
      [/Network/, /^cities$/i],
    ] as const) {
      await nav(page, section, tab);
      await expectNoPageOverflow(page);
      const status = page.getByRole("main").getByRole("status").first();
      await expect(status).toBeVisible();
      /* Every control in the header is thumb-sized. A 32px button in a
         status bar is the one a player misses on a phone. */
      for (const b of await page
        .getByRole("main")
        .locator("header button")
        .all()) {
        const box = await b.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
    }

    expect(problems).toEqual([]);
  });
});

/* --------------------------------------------------- the visual system */

/**
 * VISUALS THAT EXPLAIN
 *
 * The engine harness already proves each diagram's arithmetic matches the
 * simulation. These prove the other half: that the arithmetic reaches a
 * player — on a phone, without colour, without motion, and with the text
 * summary present whether or not the picture renders.
 */
test.describe("visuals that explain the simulation", () => {
  const nav = async (page: Page, section: RegExp, tab?: RegExp) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: section })
      .first()
      .click();
    if (tab) await page.getByRole("tab", { name: tab }).click();
  };

  const resume = async (page: Page, fixture = "midrun") => {
    await preload(page, fixture);
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
  };

  test("the patient funnel accounts for everyone who arrived", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^caseload$/i);

    const flow = page.getByRole("region", {
      name: /where your patients went/i,
    });
    await expect(flow).toBeVisible();

    /* The prose summary is the deliverable, not a caption — a player who
       cannot read the bars still gets the whole diagram. */
    const summary = await flow.innerText();
    expect(summary).toMatch(/patients presented last week/i);
    expect(summary).toMatch(/Arrived/);
    expect(summary).toMatch(/Matched a department/);
    expect(summary).toMatch(/Treated/);

    /* A loss opens into its reason and a route, rather than being a number
       with no recourse attached. */
    const drop = flow.getByRole("button", { expanded: false }).first();
    if ((await drop.count()) > 0) {
      await drop.click();
      await expect(
        flow.getByRole("button", { name: /go there/i }).first(),
      ).toBeVisible();
    }

    expect(problems).toEqual([]);
  });

  test("capacity names its binding constraint and offers the fix", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^caseload$/i);

    const cap = page.getByRole("region", { name: /what you can get through/i });
    await expect(cap).toBeVisible();
    await expect(cap.getByText(/your main limit/i)).toBeVisible();
    await expect(
      cap.getByText(/capacity is the smaller of these two/i),
    ).toBeVisible();
    /* Exactly one of the two limit cards is marked, in words. */
    await expect(cap.getByText(/^this is the limit$/i)).toHaveCount(1);
    await expect(
      cap.getByRole("button", { name: /deal with it/i }),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("a case opens into what it demands and what it pays", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^caseload$/i);

    const card = page
      .getByRole("region", { name: /last week/i })
      .getByRole("button", { expanded: false })
      .first();
    await card.click();
    await expect(page.getByText(/^department$/i).first()).toBeVisible();
    await expect(page.getByText(/^time it takes$/i).first()).toBeVisible();
    await expect(page.getByText(/^what it bills$/i).first()).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("departmental cover states the gap, not a percentage", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^team$/i);

    const grid = page.getByRole("region", { name: /departmental cover/i });
    await expect(grid).toBeVisible();
    /* Severity taken over severity needed — "3/5", not "60%". */
    await expect(grid.getByText(/\d\/\d/).first()).toBeVisible();
    /* The state is a word as well as a colour. */
    await expect(
      grid.getByText(/^(covered|thin|uncovered)$/i).first(),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("the money week is stated in a sentence before it is drawn", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^money$/i);

    const chart = page.getByRole("region", { name: /a week of money/i });
    await expect(chart).toBeVisible();
    const text = await chart.innerText();
    /* One of the three summary forms, all of which are prose. */
    expect(text).toMatch(
      /covers approximately \d+ more week|makes \$[\d,]+ a week|losing \$[\d,]+ a week/i,
    );
    await expect(chart.getByText(/charged whatever happens/i)).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("the ladder says exactly what each locked rung needs", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Career/, /^career$/i);

    const ladder = page.getByRole("region", { name: /the clinical ladder/i });
    await expect(ladder).toBeVisible();
    await expect(ladder.getByText(/^held$/i).first()).toBeVisible();
    /* A requirement is a number and a gap, never "requirements not met". */
    await expect(ladder.getByText(/CPD/).first()).toBeVisible();
    await expect(ladder.getByText(/tuition/i).first()).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("burnout is stages and rates, not a bar that kills you", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Life/);

    const balance = page.getByRole("region", {
      name: /what the week takes out of you/i,
    });
    await expect(balance).toBeVisible();
    await expect(balance.getByText(/adds to it, per block/i)).toBeVisible();
    await expect(balance.getByText(/takes it away/i)).toBeVisible();
    /* The 100 threshold is a setback now, and the copy has to say so. */
    const text = await balance.innerText();
    expect(text).not.toMatch(/ends the run|game over/i);

    expect(problems).toEqual([]);
  });

  test("standing explains its effect and its route, per category", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Career/, /^standing$/i);

    await expect(page.getByText(/what it does/i).first()).toBeVisible();
    await expect(page.getByText(/how to raise it/i).first()).toBeVisible();
    /* Six categories, six routes — not one radar chart. */
    expect(await page.getByText(/what it does/i).count()).toBe(6);

    expect(problems).toEqual([]);
  });

  test("no source PNG is ever served, and artwork stays lazy", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    const requested: string[] = [];
    page.on("request", (r) => requested.push(r.url()));

    await resume(page);
    await nav(page, /Practice/, /^caseload$/i);

    const images = requested.filter((u) => /\.(png|webp|jpe?g)/i.test(u));
    expect(
      images.filter((u) => /\.png/i.test(u)),
      "source PNGs must never reach the browser",
    ).toEqual([]);
    /* Fourteen city photographs must not land because the app booted. */
    expect(
      images.filter((u) => /cities/.test(u)).length,
      "city artwork loads one at a time, on selection",
    ).toBeLessThanOrEqual(1);

    expect(problems).toEqual([]);
  });

  test("the diagrams hold at 375px and respect reduced motion", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 375, height: 812 });
    await resume(page);

    for (const [section, tab] of [
      [/Practice/, /^caseload$/i],
      [/Practice/, /^team$/i],
      [/Practice/, /^money$/i],
      [/Career/, /^career$/i],
      [/Life/, undefined],
    ] as const) {
      await nav(page, section, tab);
      await expectNoPageOverflow(page);
    }

    /* Nothing that fills to a value may animate when the preference is set. */
    const animated = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '[role="meter"] > *, [role="progressbar"] > *',
        ),
      ]
        .map((el) => getComputedStyle(el).transitionDuration)
        .filter((d) => d !== "0s" && d !== ""),
    );
    expect(animated, "meters must not animate under reduced motion").toEqual(
      [],
    );

    expect(problems).toEqual([]);
  });

  test("the symbol family is one weight, and never an emoji", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^build$/i);

    /* One stroke weight for the whole family — the identity is enforced in
       code, and this proves it survived to the DOM. */
    const weights = await page.evaluate(() =>
      Array.from(
        new Set(
          [...document.querySelectorAll("main svg[viewBox='0 0 24 24']")].map(
            (el) => el.getAttribute("stroke-width"),
          ),
        ),
      ),
    );
    expect(weights.filter(Boolean)).toEqual(["1.6"]);

    /* No emoji anywhere in the career's own screens. */
    const text = await page.getByRole("main").innerText();
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);

    expect(problems).toEqual([]);
  });
});

/* ------------------------------------------------------ the player journeys */

/**
 * SIX JOURNEYS, END TO END
 *
 * Not feature tests. Each of these is a thing a person sits down to do, walked
 * from the first click to the point where they know what to do next — because
 * the failure this phase exists to catch is not a broken control, it is a
 * player who reaches a screen and cannot tell what it wants from them.
 *
 * Assertions are therefore about comprehension: is the cause named, is the
 * requirement stated, is there somewhere to go. A journey that renders
 * perfectly and explains nothing fails.
 */
test.describe("player journeys", () => {
  const nav = async (page: Page, section: RegExp, tab?: RegExp) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: section })
      .first()
      .click();
    if (tab) await page.getByRole("tab", { name: tab }).click();
  };

  const resume = async (page: Page, fixture = "midrun") => {
    await preload(page, fixture);
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
  };

  // ------------------------------------------------------------ new player
  test("a new player can read, plan and commit the first week", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await startRun(page);

    /* The opening situation is taught, not assumed. */
    const lesson = page.getByRole("region", {
      name: /six blocks of your time/i,
    });
    await expect(lesson).toBeVisible();
    const taught = await lesson.innerText();
    expect(taught).toMatch(/time blocks/i);
    expect(taught).toMatch(/burnout/i);
    expect(taught).toMatch(/cash/i);
    expect(taught).toMatch(/commit/i);

    /* And it does not repeat what the guidance card says three inches below. */
    await expect(
      page.getByText(/^your week is \d+ blocks of time$/i),
      "the lesson and the next-step card must not say the same thing",
    ).toHaveCount(0);

    /* Plan and commit without guessing. */
    await page.getByRole("button", { name: /^balanced$/i }).click();
    await expect(commitButton(page)).toBeEnabled();
    await playWeek(page);
    await dismissReview(page);

    /* Having done it, the lesson retires itself — no button needed. */
    await expect(
      page.getByRole("region", { name: /six blocks of your time/i }),
    ).toHaveCount(0);

    /* And the next useful action is named. */
    await expect(
      page
        .getByRole("region", { name: /needs attention/i })
        .or(page.getByText(/next step/i))
        .first(),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  // ------------------------------------------------------- growing practice
  test("growing the practice explains capacity and the new weekly cost", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^build$/i);

    /* Every purchase states both prices before it is made — the one-off on
       the card, the full breakdown a click away. */
    const card = page
      .getByRole("article")
      .filter({ hasText: /exam room|community clinic/i })
      .first();
    await expect(card.getByText(/\/wk after/i)).toBeVisible();
    await card.getByRole("button", { name: /details/i }).click();
    await expect(
      page.getByRole("dialog").getByText(/every week afterwards/i),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    /* And the capacity screen says which of the two limits is binding, so
       "will this help" has an answer before the money is spent. */
    await nav(page, /Practice/, /^caseload$/i);
    await expect(page.getByText(/your main limit/i)).toBeVisible();
    await expect(page.getByText(/^this is the limit$/i)).toHaveCount(1);

    expect(problems).toEqual([]);
  });

  // ----------------------------------------------------- career progression
  test("the career screen separates what you can do from what the practice can", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Career/, /^career$/i);

    const ladder = page.getByRole("region", { name: /the clinical ladder/i });
    await expect(ladder).toBeVisible();
    /* The distinction the whole ladder rests on, stated on the screen. */
    await expect(
      ladder.getByText(/employing a consultant|what you personally/i).first(),
    ).toBeVisible();
    /* Locked rungs quote a number, never "requirements not met". */
    await expect(
      ladder.getByText(/needs \d+ CPD|Needs skill \d+/i).first(),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  // ---------------------------------------------------------------- expansion
  test("markets can be compared before a city is entered", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Network/, /^cities$/i);

    /* Plain language on the comparison, not "max panel". */
    const body = await page.getByRole("main").innerText();
    expect(body).not.toMatch(/max panel/i);

    expect(problems).toEqual([]);
  });

  // ------------------------------------------------------------------ crisis
  test("a setback reads as recoverable, with the routes on screen", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page, "nearly-lost");

    const body = await page.getByRole("main").innerText();
    /* Nothing anywhere may claim the run is over. */
    expect(body).not.toMatch(/game over|run is over|ends the run|run ends/i);
    /* And the way out is present rather than filed somewhere. */
    await expect(
      page.getByText(/recover|restructure|way back|climb/i).first(),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  // ------------------------------------------------- long-running character
  test("a long run can review itself and decline to end", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page, "nearly-won");

    await nav(page, /Career/, /^timeline$/i);
    await expect(page.getByRole("main")).toBeVisible();

    await nav(page, /Career/, /^standing$/i);
    await expect(page.getByText(/how to raise it/i).first()).toBeVisible();

    await nav(page, /Career/, /^people$/i);
    await expect(page.getByRole("main")).toBeVisible();

    /* Retirement is offered, previewed, and cancellable. Still. */
    await nav(page, /Career/, /^character$/i);
    const retire = page.getByRole("button", { name: /retire/i }).first();
    if ((await retire.count()) > 0) {
      await retire.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog
        .getByRole("button", { name: /cancel|not yet|keep/i })
        .first()
        .click();
      await expect(dialog).toHaveCount(0);
      /* The run continues. */
      await expect(commitButton(page).or(page.getByRole("main"))).toBeVisible();
    }

    expect(problems).toEqual([]);
  });
});

/* --------------------------------------------------- teaching and vocabulary */

test.describe("teaching and vocabulary", () => {
  test("a lesson can be dismissed and brought back", async ({ page }) => {
    const problems = watchConsole(page);
    await startRun(page);

    const lesson = page.getByRole("region", {
      name: /six blocks of your time/i,
    });
    await expect(lesson).toBeVisible();
    await lesson.getByRole("button", { name: /hide this/i }).click();
    await expect(lesson).toHaveCount(0);

    /* And it survives a reload, so dismissing is a decision not a flicker.
       A reload lands on career select, so the run has to be resumed first —
       which is also the path a returning player actually takes. */
    await page.reload();
    await page.getByRole("button", { name: /continue your run/i }).click();
    await expect(
      page.getByRole("region", { name: /six blocks of your time/i }),
    ).toHaveCount(0);

    /* Reopened from the reference dialog. */
    await page.getByRole("button", { name: /what the words mean/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: /lessons/i }).click();
    await dialog
      .getByRole("button", { name: /show it again/i })
      .first()
      .click();
    await expect(
      page.getByRole("region", { name: /six blocks of your time/i }),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("the glossary leads with plain language and keeps the real word", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await startRun(page);
    await page.getByRole("button", { name: /what the words mean/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Active patients")).toBeVisible();
    await expect(
      dialog.getByText(/the game calls this .panel./i),
    ).toBeVisible();
    await expect(
      dialog.getByText("Professional learning points"),
    ).toBeVisible();
    await expect(
      dialog.getByText(/how many patients you could attract/i),
    ).toBeVisible();

    /* Escape closes it — nothing here is a decision the run waits on. */
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);

    expect(problems).toEqual([]);
  });

  test("the main interface prefers plain labels over jargon", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    const overview = await page.getByRole("main").innerText();
    expect(overview).toMatch(/active patients/i);
    /* "CPD points" as a bare label is gone; the term survives in the hint. */
    expect(overview).not.toMatch(/CPD points banked/i);

    expect(problems).toEqual([]);
  });
});

/* -------------------------------------------------------- empty and locked */

test.describe("empty and locked states", () => {
  const nav = async (page: Page, section: RegExp, tab?: RegExp) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: section })
      .first()
      .click();
    if (tab) await page.getByRole("tab", { name: tab }).click();
  };

  test("every first-week empty state explains itself and offers a next step", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await startRun(page);

    /* Each of these is genuinely empty in week one. */
    for (const [section, tab] of [
      [/Practice/, /^caseload$/i],
      [/Practice/, /^staff$/i],
      [/Practice/, /^team$/i],
      [/Practice/, /^work$/i],
      [/Career/, /^timeline$/i],
      [/Network/, /^outbreaks$/i],
    ] as const) {
      await nav(page, section, tab);
      const body = await page.getByRole("main").innerText();

      /* A dead end says only what is missing. These must also say why, and
         what the player can do about it. */
      /* "None" on its own is a legitimate value — an equipment list with
         nothing in it — so the dead-ends being caught here are the ones that
         report a refusal without a reason. */
      expect(body, `${tab.source} must not dead-end`).not.toMatch(
        /^\s*(unavailable|not enough|not available)\.?\s*$/im,
      );
      /* Length is a crude proxy for "explains itself", and a good one — a
         bare "Nothing in progress." cannot clear it. */
      expect(body.length, `${tab.source} says too little`).toBeGreaterThan(200);
    }

    expect(problems).toEqual([]);
  });

  test("an unaffordable purchase names the gap in cash", async ({ page }) => {
    const problems = watchConsole(page);
    await startRun(page);
    await nav(page, /Practice/, /^build$/i);
    await expect(page.getByText(/\$[\d,]+ short/i).first()).toBeVisible();
    expect(problems).toEqual([]);
  });

  test("a department with no room says which resource is missing", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await startRun(page);
    await nav(page, /Practice/, /^build$/i);
    /* Week one has one department slot and it is used, so every other
       department is blocked — and must say so in a sentence. */
    await expect(
      page.getByText(/no room: all \d+ department slot/i).first(),
    ).toBeVisible();
    expect(problems).toEqual([]);
  });
});

/* ----------------------------------------------------- guidance is bounded */

test.describe("guidance", () => {
  test("shows one primary recommendation and at most one secondary", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "nearly-lost");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    const stack = page.getByRole("region", { name: /needs attention/i });
    await expect(stack).toBeVisible();
    /* A struggling practice trips several rules at once. At most two reach
       the screen; the rest are counted, not hidden. */
    const cards = await stack.getByRole("button").count();
    expect(cards, "at most a primary and a secondary").toBeLessThanOrEqual(2);

    expect(problems).toEqual([]);
  });

  test("every guidance destination is a screen that exists", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();

    const stack = page.getByRole("region", { name: /needs attention/i });
    if ((await stack.count()) === 0) {
      expect(problems).toEqual([]);
      return;
    }
    /* Following the recommendation must land somewhere real, with content. */
    await stack.getByRole("button").first().click();
    await expect(page.getByRole("main")).toBeVisible();
    const body = await page.getByRole("main").innerText();
    expect(body.length).toBeGreaterThan(120);

    expect(problems).toEqual([]);
  });
});

/* -------------------------------------------------------- buying things */

/**
 * THE PURCHASE EXPERIENCE
 *
 * Thirty-three items across five catalogues, one card, one drawer, one
 * confirmation. These cover the states a player can actually reach and the two
 * failure modes that cost real money — a purchase that fires twice, and a card
 * that claims something is affordable when it is not.
 */
test.describe("purchasing", () => {
  const nav = async (page: Page, section: RegExp, tab?: RegExp) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: section })
      .first()
      .click();
    if (tab) await page.getByRole("tab", { name: tab }).click();
  };

  const resume = async (page: Page, fixture = "midrun") => {
    await preload(page, fixture);
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
  };

  test("every purchasable item shows its own artwork", async ({ page }) => {
    const problems = watchConsole(page);
    const fetched = new Set<string>();
    page.on("response", (r) => {
      const m = /\/visuals\/purchases\/([^&"?]+)/.exec(
        decodeURIComponent(r.url()),
      );
      if (m && r.status() < 400) fetched.add(m[1]);
    });

    await resume(page);
    await nav(page, /Practice/, /^build$/i);
    await scrollThrough(page);
    await nav(page, /Life/);
    for (const t of [
      /homes and properties/i,
      /vehicles/i,
      /services and wellbeing/i,
      /luxury and prestige/i,
    ]) {
      await page.getByRole("tab", { name: t }).click();
      await scrollThrough(page);
    }

    /* Four facilities, twelve machines, four homes, three cars, five services,
       five luxury items — every one with its own file, none shared. */
    expect(fetched.size, "distinct purchase images served").toBe(45);

    /* The three re-drawn cars must be the ones on screen: the originals had
       recognisable badging and are not shipped. */
    for (const car of ["reliable-saloon", "luxury-saloon", "sports-car"]) {
      expect(
        [...fetched].some((f) => f.includes(car)),
        `${car} artwork present`,
      ).toBe(true);
    }

    /* No <img> may fail to decode. */
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((i) =>
          /purchases/.test(decodeURIComponent(i.currentSrc || i.src)),
        )
        .filter((i) => !i.complete || i.naturalWidth === 0)
        .map((i) => i.alt),
    );
    expect(broken, "every purchase image decodes").toEqual([]);

    expect(problems).toEqual([]);
  });

  test("a successful purchase confirms itself and updates immediately", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Life/);

    const card = page.getByRole("article", { name: "Town house" });
    await expect(card.getByRole("button", { name: /^buy$/i })).toBeEnabled();
    await card.getByRole("button", { name: /^buy$/i }).click();

    /* The confirmation names the item, the spend and the new balance. */
    const toast = page.getByRole("status").filter({ hasText: /town house/i });
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/spent/i);
    await expect(toast).toContainText(/left/i);

    /* And the card itself changes state without a reload. */
    await expect(
      card.getByRole("button", { name: /in service|owned/i }),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("an unaffordable item says how far short, and cannot be bought", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Life/);

    const card = page.getByRole("article", { name: "Country estate" });
    await expect(card).toContainText(/short/i);
    const buy = card.getByRole("button", { name: /not enough cash/i });
    await expect(buy).toBeVisible();
    await expect(buy).toBeDisabled();

    /* The detail view repeats the reason rather than presenting a dead
       button with no explanation. */
    await card.getByRole("button", { name: /details/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(/you are .* short/i);
    await expect(
      dialog.getByRole("button", { name: /buy for/i }),
    ).toBeDisabled();

    expect(problems).toEqual([]);
  });

  test("rapid double-clicking buys exactly one", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Life/);

    const cashBefore = await readCash(page);
    const card = page.getByRole("article", { name: "Town house" });
    const buy = card.getByRole("button", { name: /^buy$/i });

    /* Three clicks with no delay, which is what a mis-fire actually looks
       like — not three deliberate presses. */
    await buy.click({ clickCount: 3, delay: 0 }).catch(() => {});
    await page.waitForTimeout(400);

    const cashAfter = await readCash(page);
    /* The town house is $180,000. Two would be $360,000. */
    expect(
      cashBefore - cashAfter,
      "exactly one town house was paid for",
    ).toBeLessThan(200_000);

    expect(problems).toEqual([]);
  });

  test("owned, in-service and trade-in states are unmistakable", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Life/);

    await page
      .getByRole("article", { name: "Town house" })
      .getByRole("button", { name: /^buy$/i })
      .click();
    await page.waitForTimeout(300);

    /* The one you keep says so in words, not only in colour. */
    const owned = page.getByRole("article", { name: "Town house" });
    await expect(owned).toContainText(/in service/i);

    /* And the next rung up now offers the trade-in. */
    const next = page.getByRole("article", { name: "House with a garden" });
    await expect(next).toContainText(/back for the town house/i);

    expect(problems).toEqual([]);
  });

  test("a purchase survives a reload", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Life/);
    await page
      .getByRole("article", { name: "Town house" })
      .getByRole("button", { name: /^buy$/i })
      .click();
    await page.waitForTimeout(400);

    await page.reload();
    await page.getByRole("button", { name: /continue your run/i }).click();
    await nav(page, /Life/);
    await expect(
      page.getByRole("article", { name: "Town house" }),
    ).toContainText(/in service/i);

    expect(problems).toEqual([]);
  });

  test("the detail drawer is keyboard-operable and returns focus", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^build$/i);

    const opener = page
      .getByRole("article", { name: "Community clinic" })
      .getByRole("button", { name: /details/i });
    await opener.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/treatment slots/i);
    await expect(dialog).toContainText(/every week afterwards/i);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();

    expect(problems).toEqual([]);
  });

  test("the catalogue holds at every width with no overflow", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);

    for (const width of [1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await nav(page, /Practice/, /^build$/i);
      await expectNoPageOverflow(page);
      await nav(page, /Life/);
      await expectNoPageOverflow(page);

      /* Price and state stay on screen at every size. */
      const card = page.getByRole("article", { name: "Town house" });
      await expect(card).toContainText(/\$180,000/);
      await expect(
        card.getByRole("button", { name: /buy|in service|owned|not enough/i }),
      ).toBeVisible();

      /* And the drawer is usable rather than a squeezed desktop modal. */
      await card.getByRole("button", { name: /details/i }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box!.width, `drawer width at ${width}`).toBeGreaterThan(
        Math.min(340, width * 0.85),
      );
      await page.keyboard.press("Escape");
    }

    expect(problems).toEqual([]);
  });

  test("no source PNG reaches the browser", async ({ page }) => {
    const problems = watchConsole(page);
    const pngs: string[] = [];
    page.on("request", (r) => {
      const u = decodeURIComponent(r.url());
      if (/art-source|purchases.*\.png/i.test(u)) pngs.push(u);
    });

    await resume(page);
    await nav(page, /Practice/, /^build$/i);
    await scrollThrough(page);

    expect(pngs, "masters stay in art-source").toEqual([]);
    expect(problems).toEqual([]);
  });
});

/** Walk a long screen so lazy images below the fold actually load. */
async function scrollThrough(page: Page) {
  for (let i = 0; i < 24; i++) {
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(700);
}

/** Cash as an integer, from the status strip. */
async function readCash(page: Page): Promise<number> {
  const text = await page.getByRole("main").innerText();
  const m = /\$([\d,]+)/.exec(text);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
}

/* --------------------------------------------------- departments as cards */

/**
 * DEPARTMENTS
 *
 * The last purchase in the game to become a card, and the one carrying the
 * most state: a department can be locked for want of a slot, unaffordable,
 * open and uncovered, or open and fully staffed — and those are four different
 * things a player has to be able to tell apart at a glance.
 */
test.describe("department cards", () => {
  const nav = async (page: Page, section: RegExp, tab?: RegExp) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: section })
      .first()
      .click();
    if (tab) await page.getByRole("tab", { name: tab }).click();
  };

  const resume = async (page: Page, fixture = "midrun") => {
    await preload(page, fixture);
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
  };

  const scrollThrough = async (page: Page) => {
    for (let i = 0; i < 26; i++) {
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(900);
  };

  test("all twelve departments show their own interior", async ({ page }) => {
    const problems = watchConsole(page);
    const fetched = new Set<string>();
    page.on("response", (r) => {
      const m = /\/visuals\/purchases\/departments\/([^&"?]+)/.exec(
        decodeURIComponent(r.url()),
      );
      if (m && r.status() < 400) fetched.add(m[1]);
    });

    await resume(page);
    await nav(page, /Practice/, /^build$/i);
    await scrollThrough(page);

    expect(fetched.size, "one interior per department").toBe(12);
    /* Each of the twelve is a distinct file — no two fields share a room. */
    expect(new Set([...fetched]).size).toBe(12);

    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((i) =>
          /purchases\/departments/.test(
            decodeURIComponent(i.currentSrc || i.src),
          ),
        )
        .filter((i) => !i.complete || i.naturalWidth === 0)
        .map((i) => i.alt),
    );
    expect(broken, "every department image decodes").toEqual([]);

    expect(problems).toEqual([]);
  });

  test("the twelve machines use the re-shot scenes", async ({ page }) => {
    const problems = watchConsole(page);
    const fetched = new Set<string>();
    page.on("response", (r) => {
      const m = /\/visuals\/purchases\/equipment\/([^&"?]+)/.exec(
        decodeURIComponent(r.url()),
      );
      if (m && r.status() < 400) fetched.add(m[1]);
    });

    await resume(page);
    await nav(page, /Practice/, /^build$/i);
    await scrollThrough(page);

    expect(fetched.size, "one scene per machine").toBe(12);
    /* Runtime names carry no version suffix — the build resolves it — so what
       is asserted here is that nothing labelled -v1 or -v2 leaks into a URL. */
    expect(
      [...fetched].filter((f) => /-v\d/.test(f)),
      "runtime names are version-free",
    ).toEqual([]);

    expect(problems).toEqual([]);
  });

  test("a department card carries cost, upkeep and its case load", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^build$/i);

    const card = page.getByRole("article", { name: "Cardiology" });
    await card.scrollIntoViewIfNeeded();
    await expect(card).toContainText(/\$66,000/);
    await expect(card).toContainText(/\$1,150\/wk after/);
    await expect(card).toContainText(/heart unit/i);

    await card.getByRole("button", { name: /details/i }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText(/case types it takes/i)).toBeVisible();
    await expect(drawer.getByText(/hardest case/i)).toBeVisible();
    await expect(drawer.getByText(/department slots/i)).toBeVisible();
    await expect(drawer.getByText(/who can work it/i)).toBeVisible();
    await expect(drawer.getByText(/equipment it uses/i)).toBeVisible();
    await page.keyboard.press("Escape");

    expect(problems).toEqual([]);
  });

  test("an open department reports its coverage in words", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^build$/i);

    /* The mid-run fixture has general practice open. Whatever its cover, the
       card must state it as a word and as a severity pair, never as a colour
       alone. */
    const gp = page.getByRole("article", { name: "General Practice" });
    await gp.scrollIntoViewIfNeeded();
    await expect(gp.getByText(/^(covered|thin|uncovered)$/i)).toBeVisible();
    await expect(gp.getByText(/takes severity \d of \d/i)).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("with no free slot every closed department says so", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    /* A fresh run has one department slot and general practice already in it,
       so every other field is genuinely refused — which is the engine's rule,
       not a decoration. */
    await startRun(page);
    await nav(page, /Practice/, /^build$/i);

    const cardio = page.getByRole("article", { name: "Cardiology" });
    await cardio.scrollIntoViewIfNeeded();
    await expect(
      cardio.getByRole("button", { name: /^locked$/i }),
    ).toBeDisabled();
    await expect(cardio).toContainText(/locked/i);

    await cardio.getByRole("button", { name: /details/i }).click();
    const drawer = page.getByRole("dialog");
    await expect(
      drawer.getByText(/all 1 department slot is in use/i),
    ).toBeVisible();
    await expect(
      drawer.getByRole("button", { name: /buy for/i }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");

    expect(problems).toEqual([]);
  });

  test("opening a department confirms itself and updates the card", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^build$/i);

    const card = page.getByRole("article", { name: "Dermatology" });
    await card.scrollIntoViewIfNeeded();
    await card.getByRole("button", { name: /^buy$/i }).click();

    const toast = page.getByRole("status").filter({ hasText: /dermatology/i });
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/spent/i);

    /* Immediately, without a reload. */
    await expect(
      card.getByRole("button", { name: /owned|in service/i }),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("a department stays open after a reload", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^build$/i);
    const card = page.getByRole("article", { name: "Dermatology" });
    await card.scrollIntoViewIfNeeded();
    await card.getByRole("button", { name: /^buy$/i }).click();
    await page.waitForTimeout(400);

    await page.reload();
    await page.getByRole("button", { name: /continue your run/i }).click();
    await nav(page, /Practice/, /^build$/i);
    const after = page.getByRole("article", { name: "Dermatology" });
    await after.scrollIntoViewIfNeeded();
    await expect(
      after.getByRole("button", { name: /owned|in service/i }),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("opening one twice does not charge twice", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Practice/, /^build$/i);

    const before = await page.getByRole("main").innerText();
    const cashBefore = Number(
      /\$([\d,]+)/.exec(before)?.[1].replace(/,/g, "") ?? 0,
    );

    const card = page.getByRole("article", { name: "Dermatology" });
    await card.scrollIntoViewIfNeeded();
    await card
      .getByRole("button", { name: /^buy$/i })
      .click({ clickCount: 3, delay: 0 })
      .catch(() => {});
    await page.waitForTimeout(400);

    const after = await page.getByRole("main").innerText();
    const cashAfter = Number(
      /\$([\d,]+)/.exec(after)?.[1].replace(/,/g, "") ?? 0,
    );
    /* Dermatology opens for $12,000. Two would be $24,000. */
    expect(cashBefore - cashAfter).toBeLessThan(20_000);

    expect(problems).toEqual([]);
  });

  test("equipment says when nobody can run it", async ({ page }) => {
    const problems = watchConsole(page);
    await startRun(page);
    await nav(page, /Practice/, /^build$/i);

    /*
     * The requirement is stated before you own anything.
     *
     * The *warning* is a different thing and fires on a different rule: you
     * are not short of technicians until you own a machine that needs one, so
     * a fresh run correctly shows the requirement and no alarm.
     */
    const lab = page.getByRole("article", { name: "Pathology lab" });
    await lab.scrollIntoViewIfNeeded();
    await lab.getByRole("button", { name: /details/i }).click();
    let drawer = page.getByRole("dialog");
    await expect(drawer.getByText(/needs a technician/i)).toBeVisible();
    await expect(
      drawer.getByText(/one technician covers three machines/i),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    /* Buy it, and the next machine that needs a technician must now warn that
       it would sit idle — because at that point it genuinely would. */
    await preload(page, "midrun");
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
    await nav(page, /Practice/, /^build$/i);
    const ecg = page.getByRole("article", { name: "Pathology lab" });
    await ecg.scrollIntoViewIfNeeded();
    await ecg.getByRole("button", { name: /^buy$/i }).click();
    await page.waitForTimeout(400);

    const ultrasound = page.getByRole("article", { name: "Ultrasound suite" });
    await ultrasound.scrollIntoViewIfNeeded();
    await ultrasound.getByRole("button", { name: /details/i }).click();
    drawer = page.getByRole("dialog");
    await expect(drawer.getByText(/sit idle/i)).toBeVisible();
    await page.keyboard.press("Escape");

    expect(problems).toEqual([]);
  });

  test("the department shelf holds at every width", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page);

    for (const width of [1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await nav(page, /Practice/, /^build$/i);
      await expectNoPageOverflow(page);

      const card = page.getByRole("article", { name: "Cardiology" });
      await card.scrollIntoViewIfNeeded();
      await expect(card).toContainText(/\$66,000/);
      await expect(
        card.getByRole("button", { name: /buy|owned|locked|not enough/i }),
      ).toBeVisible();
    }

    expect(problems).toEqual([]);
  });
});

/* ----------------------------------------------------------- portraits */

/**
 * FACES ON SCREEN
 *
 * The registry's own arithmetic is proved in `npm run check`. These prove the
 * other half: that the right face reaches the right surface, that a broken
 * image degrades to initials rather than a broken glyph, and that the
 * organisation accounts never acquire a human one.
 */
test.describe("character portraits", () => {
  const nav = async (page: Page, section: RegExp, tab?: RegExp) => {
    await page
      .getByRole("navigation", { name: "Primary" })
      .last()
      .getByRole("button")
      .filter({ hasText: section })
      .first()
      .click();
    if (tab) await page.getByRole("tab", { name: tab }).click();
  };

  const resume = async (page: Page, fixture = "midrun") => {
    await preload(page, fixture);
    await page.goto("/");
    await page.getByRole("button", { name: /continue your run/i }).click();
  };

  test("the People screen shows each character's own face", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    const fetched = new Set<string>();
    page.on("response", (r) => {
      const m = /\/visuals\/characters\/([^&"?]+)/.exec(
        decodeURIComponent(r.url()),
      );
      if (m && r.status() < 400) fetched.add(m[1]);
    });

    await resume(page);
    await nav(page, /Career/, /^people$/i);
    await page.waitForTimeout(1200);

    /* The mid-run cast is on screen and every one of them has a distinct
       file — no two colleagues share a face. */
    expect(fetched.size).toBeGreaterThanOrEqual(8);
    expect(new Set([...fetched]).size).toBe(fetched.size);

    const broken = await page.evaluate(
      () =>
        [...document.querySelectorAll("img")]
          .filter((i) =>
            /characters/.test(decodeURIComponent(i.currentSrc || i.src)),
          )
          .filter((i) => !i.complete || i.naturalWidth === 0).length,
    );
    expect(broken, "every portrait decodes").toBe(0);

    expect(problems).toEqual([]);
  });

  test("a People card still expands, with a larger portrait", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Career/, /^people$/i);

    const row = page
      .getByRole("button")
      .filter({ hasText: /Prof. Iris Hallam/ })
      .first();
    await expect(row).toHaveAttribute("aria-expanded", "false");
    await row.focus();
    await page.keyboard.press("Enter");
    await expect(row).toHaveAttribute("aria-expanded", "true");

    /* The relationship numbers are still the point of the card. */
    await expect(page.getByText(/^warmth$/i).first()).toBeVisible();
    await expect(page.getByText(/^trust$/i).first()).toBeVisible();
    await expect(page.getByText(/^respect$/i).first()).toBeVisible();

    /* And the profile derivative is what loaded, not the 160px avatar. */
    const usedProfile = await page.evaluate(() =>
      [...document.querySelectorAll("img")].some((i) =>
        decodeURIComponent(i.currentSrc || i.src).includes("@profile"),
      ),
    );
    expect(usedProfile, "the expanded card uses the 512px file").toBe(true);

    expect(problems).toEqual([]);
  });

  test("all five rivals are recognisable", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page);
    await nav(page, /Network/, /^rivals$/i);
    await page.waitForTimeout(1000);

    /* Five rivals, five faces, and the strategy and standing they always
       carried. A portrait must not have displaced the numbers. */
    const faces = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLImageElement>("main img")].filter(
          (i) =>
            /characters\/cast/.test(decodeURIComponent(i.currentSrc || i.src)),
        ).length,
    );
    expect(faces).toBeGreaterThanOrEqual(5);
    await expect(page.getByText(/Dr Anneke Roth/).first()).toBeVisible();
    await expect(page.getByText(/Dr Sofia Aranda/).first()).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("organisation accounts never show a human face", async ({ page }) => {
    const problems = watchConsole(page);
    await resume(page);
    await page.getByRole("button", { name: /open phone/i }).click();
    await page.waitForTimeout(1200);

    /*
     * Every avatar that loads on the phone must belong to a human account.
     * `@meridian` is Meridian Health Group; the person behind it is Dr Anneke
     * Roth, and her portrait appearing here would be the collision this whole
     * registry exists to prevent.
     */
    const dialog = page.getByRole("dialog");
    const rows = await dialog.evaluate((el) =>
      [...el.querySelectorAll("img")].map((i) =>
        decodeURIComponent(
          (i as HTMLImageElement).currentSrc || (i as HTMLImageElement).src,
        ),
      ),
    );
    expect(
      rows.filter((r) => /anneke-roth|sofia-aranda/.test(r)),
      "no organisation post carries a personal portrait",
    ).toEqual([]);

    expect(problems).toEqual([]);
  });

  test("a portrait that fails to load falls back to initials", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    /*
     * Every portrait request is aborted, so the component's error path is the
     * only thing that can draw an avatar.
     *
     * Matched on the *decoded* URL rather than a glob: Next serves these
     * through `/_next/image?url=%2Fvisuals%2Fcharacters%2F…`, so a glob on the
     * plain path aborts nothing and the test passes while proving nothing.
     */
    await page.route(
      (url) => decodeURIComponent(url.href).includes("/visuals/characters/"),
      (route) => route.abort(),
    );

    await resume(page);
    await nav(page, /Career/, /^people$/i);
    await page.waitForTimeout(900);

    /* No broken-image glyph: the failed <img> elements are gone entirely,
       replaced by the initials tile. */
    const stillImages = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLImageElement>("main img")].filter(
          (i) => /characters/.test(decodeURIComponent(i.currentSrc || i.src)),
        ).length,
    );
    expect(stillImages, "failed portraits are replaced, not left broken").toBe(
      0,
    );

    /* And the screen still identifies everybody. */
    await expect(page.getByText(/Prof. Iris Hallam/).first()).toBeVisible();
    await expect(page.getByText(/Dr Femi Okoro/).first()).toBeVisible();

    /* A failed image request is expected here and is not an app error. */
    expect(
      problems.filter((p) => !/Failed to load|ERR_FAILED|net::/i.test(p)),
    ).toEqual([]);
  });

  test("no full-resolution master reaches the browser", async ({ page }) => {
    const problems = watchConsole(page);
    const pngs: string[] = [];
    page.on("request", (r) => {
      const u = decodeURIComponent(r.url());
      if (/art-source|characters.*\.png/i.test(u)) pngs.push(u);
    });

    await resume(page);
    await nav(page, /Career/, /^people$/i);
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: /open phone/i }).click();
    await page.waitForTimeout(900);

    expect(pngs, "masters stay in art-source").toEqual([]);
    expect(problems).toEqual([]);
  });

  test("portraits hold at every avatar size without shifting layout", async ({
    page,
  }) => {
    const problems = watchConsole(page);
    await resume(page);

    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await nav(page, /Career/, /^people$/i);
      await page.waitForTimeout(900);
      await expectNoPageOverflow(page);

      /* Every avatar is square and matches its declared box, which is what
         stops a feed reflowing as the faces arrive. */
      const boxes = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLImageElement>("main img")]
          .filter((i) =>
            /characters/.test(decodeURIComponent(i.currentSrc || i.src)),
          )
          .map((i) => {
            const r = i.getBoundingClientRect();
            return Math.abs(r.width - r.height);
          }),
      );
      expect(
        boxes.every((d) => d < 1.5),
        "avatars stay square",
      ).toBe(true);
    }

    expect(problems).toEqual([]);
  });
});
