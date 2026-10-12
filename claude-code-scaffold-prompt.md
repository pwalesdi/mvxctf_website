# Monte Vista site — GitHub Pages build

Two parts: setup you do by hand, then a prompt for Claude Code.

---

## Part 1 — What you do first (about 20 minutes)

### Set up the repo

The repo exists: **github.com/pwalesdi/mvxctf_website**

1. Confirm it's **public**. GitHub Pages is free on public repos; private repos need a paid plan. If it's private, either flip it in Settings → General → Danger Zone, or be ready to pay.
2. Clone it to your machine if you haven't.
3. Drop two files in the repo root, both downloadable from this chat:
   - `montevistaxc-mockup.html` — the approved home page design
   - `mv-state-history.html` — the finished State record book (it's in the project files)

Don't edit either one. Claude Code takes them apart.

### Create the schedule sheet

New Google Sheet named **MV Schedule**, one tab called `Meets`, with exactly these headers in row 1:

| date | meet | location | sport | level | results_url | notes |
| --- | --- | --- | --- | --- | --- | --- |

- `date` — YYYY-MM-DD, so it sorts correctly
- `sport` — `XC` or `TF`
- `level` — `Varsity`, `JV`, `Frosh-Soph`, or `All`
- `results_url` — Athletic.net link, blank until results exist
- `notes` — optional, shows as small text under the meet name

Put three or four real 2026 meets in so there's something to test against.

Then **File → Share → Publish to web → Meets → Comma-separated values (.csv) → Publish.** Copy that URL. It looks like `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv`. That's the URL the site reads.

Share the sheet itself as editor with your team parent. That's the whole handoff: they edit rows, the site picks it up within a few minutes.

**One caveat:** "Publish to web" makes that CSV readable by anyone with the link. Don't put anything in the sheet you wouldn't post publicly — no phone numbers, no athlete addresses.

---

## Part 2 — Paste this into Claude Code

---

I'm building a static website for my high school cross country and track team, hosted on GitHub Pages at montevistaxc.com. The repo is this folder. There's a file called `montevistaxc-mockup.html` in the root — a complete, approved single-page design. Your job is to turn it into a proper multi-page site.

**Do not redesign anything.** The mockup's colors, typography, spacing, and section structure are final and already reviewed. You're restructuring, not improving.

### Target structure

```
index.html
schedule.html
state-history.html
cross-country.html
track-field.html
coaches.html
records.html
donate.html
summer-run.html
assets/css/site.css
assets/js/schedule.js
assets/img/
CNAME
README.md
.nojekyll
```

There's a second file in the root, `mv-state-history.html` — a finished "Monte Vista at State" record book with 39 years of data embedded in it. It becomes `state-history.html`. Step 5b covers it.

### Step 1 — Extract the design system

Pull everything inside `<style>` in the mockup into `assets/css/site.css`, unchanged. Every page links it. This file is the single source of truth for the design — the equivalent of a global theme. Never write inline styles in a page; if something needs a new style, add a class here.

The mockup has a few inline `style=""` attributes on section elements. Convert those to classes in the stylesheet too.

### Step 2 — Build index.html

Take the mockup's body as-is. Replace the `<style>` block with a stylesheet link. Keep all seven sections: header, hero, accomplishments, clearance process, practice & schedule, sign-ups, contacts, then the footer.

The hero and logo currently point at `static.wixstatic.com` URLs. Download both into `assets/img/` and repoint them, so the site doesn't depend on Wix once we leave.

### Step 3 — Shared header and footer

Static HTML has no includes, and I don't want a build step. Duplicate the header and footer markup across all pages, identical except for which nav link carries `aria-current="page"`.

Because they're duplicated, treat them as a unit: **whenever I ask you to change the header or footer, change it in every page in the same commit.** Note this in README.md so it isn't forgotten later.

### Step 4 — The schedule, from Google Sheets

`schedule.html` has the same header/footer and a main section that renders meets from a published Google Sheet CSV. I'll give you the URL — put it in one clearly marked constant at the top of `assets/js/schedule.js`.

Requirements:

- Fetch the CSV on page load, parse it, render a table: date, meet, location, level, and a results link where `results_url` is non-empty.
- **Write your own CSV parser that handles quoted fields containing commas.** No CDN dependency — this site should still work in five years with nobody maintaining it. Meet names will contain commas.
- Sort by date ascending. Split into "Upcoming" and "Completed" based on today's date.
- Filter by the `sport` column, with a toggle for XC / Track & Field.
- Style the table with the existing `.panel`, `table`, `th`, `td`, `td.num` classes already in the stylesheet. No new visual language.
- Show a plain "Loading schedule…" line while fetching.
- If the fetch fails, show: "The schedule couldn't load. See the full schedule on Athletic.net." with a link — never a blank page or a JS error.
- Escape all values before inserting them into the DOM. Parents type into this sheet; treat it as untrusted input.

On `index.html`, add a small "Next meet" element in the practice & schedule section that reads the same CSV and shows only the next upcoming meet. Reuse the same parser — don't write it twice.

### Step 5 — The other pages

Build the remaining pages with the shared header/footer and the mockup's visual language. Content for most is thin right now — use a single section with a heading and a short placeholder paragraph that clearly reads as a placeholder, and list what's missing in README.md. I'll fill them in later. Don't invent program history, records, or coach bios.

`donate.html` should carry the $600 amount, the check-payable-to instruction, the MVHS webstore link, and the no-cash-Venmo-Zelle line, matching the wording on the home page exactly.

### Step 5b — The State history page

`mv-state-history.html` in the root is a finished, approved record book: CIF State and Woodward Park results from 1987 to 2026, with all the data embedded as JavaScript objects and six interactive sortable tables. **Do not touch the data or the table logic.** It works; leave it alone.

What it needs is to stop being a standalone file and start being a page on this site:

1. Rename it `state-history.html`.
2. Add the shared site header and footer, with the nav marking Cross Country as current.
3. Reconcile its design with the site's. It was built on its own and uses a different palette and display face:

| It uses | Site uses | Do this |
| --- | --- | --- |
| `--red: #E51837` | `#C0102A` | Change to the site red |
| `--red-ink: #B8102A` | `#A20D23` | Change to the site red-ink |
| `--paper: #F4F2EF` | `#FFFFFF` ground, `#F6F3F1` surface | Use the site's surface for its paper |
| `--ink: #1C1A19` | `#16110F` | Use the site ink |
| Anton for headings | Archivo 800 at ~76% width, uppercase | Swap to Archivo; keep the same sizes |
| Space Mono for numbers | — | **Keep it.** Add Space Mono to the site stylesheet as the tabular/numeric face |

Move its shared rules into `assets/css/site.css` and leave only what's genuinely page-specific (the year strip, the podium list, the qualifier groups, the chips) in a `<style>` block on that page. Space Mono is a real addition to the design system — use it for the schedule table's times too.

4. The page is light-only by design. If the site stylesheet has dark-mode tokens, this page opts out; don't try to build it a dark theme.
5. Add a link to it from the Cross Country page and from the home page's accomplishments band.

One wording rule that matters: the page says **"fastest in school history"** and never "school record." Keep it that way everywhere, including anything you add.

### Step 6 — Pages configuration

- `CNAME` containing one line: `montevistaxc.com`
- `.nojekyll` (empty file) so GitHub doesn't run Jekyll over it
- `README.md` with: how to run locally, where the design system lives, the duplicated-header rule, the Google Sheet URL and column spec, and the list of unfinished pages

### Step 7 — Check it

Serve it locally with `python3 -m http.server` and load it. Verify: the stylesheet applies, the schedule renders from the sheet, the sport toggle works, images load from `assets/img/`, and nothing 404s. Check it at phone width — most visitors are on phones, and every grid should collapse to one column.

Report what you built, what you couldn't, and anything in the mockup that didn't translate cleanly. Don't tell me it works if you haven't loaded it.

---

## Part 3 — After Claude Code finishes

1. Commit and push.
2. Repo **Settings → Pages**, source `main` branch, root folder. Wait for the build.
3. Confirm it loads at `pwalesdi.github.io/mvxctf_website` before touching DNS.
4. **Only then** point the domain. In Wix domain settings, use the external-site connection: four A records for the apex at GitHub's IPs (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) and a CNAME for `www` → `pwalesdi.github.io`.
5. Back in repo Settings → Pages, add `montevistaxc.com` as the custom domain and tick **Enforce HTTPS** once the certificate provisions. That can take up to 24 hours.

DNS takes time to propagate, so do this on a weekday evening rather than the night before a meet.

### Two things you lose

Your Wix analytics go away — you were at 260 unique visitors a month. If you want to keep counting, add something lightweight later; GitHub Pages has no built-in stats.

And you'll be paying Wix roughly $20/yr for domain registration while hosting elsewhere. Fine, but worth transferring the domain out eventually so you're not maintaining a Wix account for one line item.

---

Sources: [Wix — Connecting a Wix Domain to an External Site](https://support.wix.com/en/article/connecting-a-wix-domain-to-an-external-site), [GitHub Docs — Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
