# Audit Funnel Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current minimal personal site into a freelance acquisition funnel by shipping the `/audit/` landing page, `/services/` overview, two case studies, a post-payment thank-you page, and the supporting home-page and SEO updates. Launch is the ACTIVE path only (single-price $497, post-payment reconciliation, external Google Form). Items marked DEFERRED in `spec_website_changes.md` are explicitly NOT built.

**Architecture:** Static Astro 5 site. All new pages inherit the existing `Base.astro` layout (640px container, warm-cream background `#fdfcfb`, serif typography, rust-orange accent `#b85a3b`). The two case studies reuse the wider 800px `BlogPost.astro` layout via `.mdx` frontmatter, matching existing blog-post typography. One new component — `CTAButton.astro` — introduces the first styled button in the codebase and is the only new visual element. No JavaScript beyond what Astro already emits. External services (PayPal, Calendly, Google Form) are linked by URL placeholder tokens that get replaced once the pipeline spec is wired.

**Tech Stack:** Astro 5.0, MDX, Astro sitemap integration, plain CSS (no Tailwind, no component library). Yarn for install. Deployed to Vercel on push to `main`.

**Reference docs:**
- Spec: `spec_website_changes.md`
- Voice rules: `writing_style.md` (project root, gitignored)
- Case study content: `/Users/dg/lab/job_apps/case_studies/callkaro_case_study.md` and `beacon_case_study.md`

**Verification model (no test framework in this repo):**
- After every file change, run `npm run build` and expect a clean build (zero warnings, zero errors).
- After a logical group of pages ships, run `npm run dev`, open the page in a browser, and eyeball the layout, copy, and link destinations.
- Final end-to-end funnel test (PayPal $1 invoice → Google Form → reconciliation) is covered in the pipeline spec, not here. This plan ends at "pages render correctly with placeholder URLs".

**External URL constants in `src/config/audit.ts`:**
- `PAYPAL_LINK = 'https://www.paypal.com/ncp/payment/PHAQHJKXEBN52'` — hosted PayPal NCP button URL (fixed-amount $497, opens in new tab, returns to `/audit/thank-you/` after payment).
- `CALENDLY_CALL_URL = 'https://calendly.com/dewanggogte/30min'` — single Calendly event linked from the website (30-min intro/questions call). Other events (understanding call, review call) are booked via email after intake, not linked from the site.
- `GOOGLE_FORM_URL = 'TODO:GOOGLE_FORM_URL'` — only remaining placeholder. Swap in Task 11 once the Google Form is set up per pipeline spec §11.

**Risks & Tradeoffs:**
- *No automated tests.* The build passing does not prove the copy is correct or the links go to the right place. Mitigation: Task 12 is a manual browser walkthrough with an explicit checklist.
- *First styled button in the codebase.* `CTAButton.astro` sets a precedent. Keeping it scoped to just primary/secondary variants — no sizes, no icons — so it doesn't bloat before we know what we actually need.
- *One placeholder URL still ships.* `GOOGLE_FORM_URL` is `TODO:` until the pipeline spec completes — the "Open the intake form" CTA on `/audit/thank-you/` will be a broken link until Task 11. Low risk: `/audit/thank-you/` is only reached after a real PayPal payment, and the page text tells the buyer to reply to the PayPal receipt email if anything is unclear. Still, don't deploy publicly until Task 11 is done.
- *Case-study port uses MDX + BlogPost layout.* Easier to write, but the BlogPost layout has a "Back to Blog" link in its header. We accept this for launch (a case study with a "Back to Blog" link is still usable) and file a followup to make the back-link configurable. Noted at the end of the plan.
- *No A/B price test at launch.* Single price $497. All A/B mechanics in spec §3.1.1 are DEFERRED. The plan preserves this as `src/config/audit.ts`'s `PRICE = 497` constant so re-enabling is a small code change, not a rewrite.

---

## File Map

**New files:**
| Path | Purpose |
|------|---------|
| `src/config/audit.ts` | Central module for placeholder URLs + price constant. One-file find-and-replace target when pipeline spec completes. |
| `src/components/CTAButton.astro` | Primary/secondary styled button, reused across `/audit/`, `/services/`, case studies. |
| `src/pages/audit/index.astro` | AI Operations Audit landing page. PRIMARY conversion page. |
| `src/pages/audit/thank-you.astro` | Post-PayPal landing. Noindexed. Single large "Open the intake form" link out to Google Form. |
| `src/pages/services/index.astro` | Services overview, pricing, case-study links, how-to-start. |
| `src/pages/services/case-studies/callkaro.mdx` | CallKaro case study (ported from `case_studies/callkaro_case_study.md`) using BlogPost layout. |
| `src/pages/services/case-studies/beacon.mdx` | Beacon case study (ported from `case_studies/beacon_case_study.md`) using BlogPost layout. |

**Modified files:**
| Path | Change |
|------|--------|
| `src/layouts/Base.astro` | Add `noindex` prop; update `pageDescriptions` for new routes. |
| `src/pages/index.mdx` | Rewrite bio + add audit paragraph, make availability pill a link, update footer links. |
| `astro.config.mjs` | Add new routes to `lastModDates`; exclude `/audit/thank-you/` from sitemap. |

**Explicitly NOT built (DEFERRED in spec):**
- `src/pages/audit/checkout.astro` — pre-PayPal capture form (spec §3.2)
- A/B variant rendering on `/audit/` (spec §3.1.1)
- Apps Script Web Apps (checkout + IPN handlers)
- `/audit/checkout/` entry in `pageDescriptions` and sitemap filter

---

## Task 1: Centralised audit config module

**Why first:** every downstream page imports from this, so getting it right once avoids a scatter of `TODO:` strings across seven files.

**Files:**
- Create: `src/config/audit.ts`

- [ ] **Step 1: Create the config module**

```ts
// src/config/audit.ts
//
// Single source of truth for external URLs used by the audit funnel.
// GOOGLE_FORM_URL is still a TODO placeholder until the pipeline spec
// (spec_automated_pipeline.md §11) completes. Keep the token name — it's
// grep-able for the replacement pass.

export const AUDIT_PRICE_USD = 497;

export const PAYPAL_LINK = 'https://www.paypal.com/ncp/payment/PHAQHJKXEBN52';
export const CALENDLY_CALL_URL = 'https://calendly.com/dewanggogte/30min';
export const GOOGLE_FORM_URL = 'TODO:GOOGLE_FORM_URL';
```

- [ ] **Step 2: Verify build still passes**

Run: `npm run build`
Expected: clean build, no new warnings. The module is not imported yet, but TypeScript should still type-check it.

- [ ] **Step 3: Commit**

```bash
git add src/config/audit.ts
git commit -m "feat: central audit URL config module"
```

---

## Task 2: CTAButton component

**Files:**
- Create: `src/components/CTAButton.astro`

**Reference:** spec §3.10.

- [ ] **Step 1: Write the component**

```astro
---
// src/components/CTAButton.astro
interface Props {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  external?: boolean;
}

const { label, href, variant = 'primary', external = false } = Astro.props;
const rel = external ? 'noopener noreferrer' : undefined;
const target = external ? '_blank' : undefined;
---

<a
  href={href}
  class={`cta-button cta-${variant}`}
  target={target}
  rel={rel}
>
  {label}
</a>

<style>
  .cta-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-size: 0.95rem;
    font-weight: 500;
    font-family: inherit;
    line-height: 1.2;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .cta-button + .cta-button {
    margin-left: 0.75rem;
  }

  .cta-primary {
    background: var(--accent);
    color: #fff;
    border: 1px solid var(--accent);
  }

  .cta-primary:hover {
    background: #9d4a30;
    border-color: #9d4a30;
    color: #fff;
    text-decoration: none;
  }

  .cta-secondary {
    background: transparent;
    color: var(--accent);
    border: 1px solid var(--accent);
  }

  .cta-secondary:hover {
    background: var(--accent);
    color: #fff;
    text-decoration: none;
  }

  @media (max-width: 480px) {
    .cta-button {
      display: block;
      text-align: center;
    }
    .cta-button + .cta-button {
      margin-left: 0;
      margin-top: 0.75rem;
    }
  }
</style>
```

**Why `#9d4a30` for hover:** it's the existing `--accent` (`#b85a3b`) darkened ~15%. Keeping the hover darken inline (rather than as a token) because this is the only hover state that uses it.

**Why the `+` sibling selector instead of a wrapper `div`:** spec §3.10 says "Display: inline-block so CTAs can sit side-by-side". The sibling-margin pattern avoids introducing a CTA-group wrapper component before we know we need one.

- [ ] **Step 2: Smoke-test by temporarily importing in `index.mdx`**

Open `src/pages/index.mdx`, add at top: `import CTAButton from '../components/CTAButton.astro';`, add `<CTAButton label="Test" href="/audit/" variant="primary" />` somewhere in the body, run `npm run dev`, visit `http://localhost:4321/`.

Expected: button renders, has accent background, darkens on hover.

- [ ] **Step 3: Revert the smoke-test changes in `index.mdx`**

Leave `index.mdx` as it was — Task 7 rewrites it properly.

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/CTAButton.astro
git commit -m "feat: CTAButton component with primary and secondary variants"
```

---

## Task 3: Base.astro — noindex support + pageDescriptions

**Why now:** Task 4 and Task 6 will use the `noindex` prop and the new `pageDescriptions` keys. Shipping the layout change first means later pages can be built against it without a half-working state.

**Files:**
- Modify: `src/layouts/Base.astro`

**Reference:** spec §3.8.

- [ ] **Step 1: Update `pageDescriptions`**

Replace the existing `pageDescriptions` object (lines 15-21) with:

```ts
const pageDescriptions: Record<string, string> = {
  '/': 'Freelance AI automation and product work for businesses with manual operational processes. Based in Bangalore, working globally.',
  '/audit/': 'Fixed $497 AI Operations Audit. I find 20+ hours a week of work your team can automate, or the audit is free.',
  '/audit/thank-you/': 'Thanks for booking the AI Operations Audit. Here are the next steps.',
  '/services/': 'Freelance AI automation, product consulting, and fractional ops. Services, pricing, and case studies from Dewang Gogte.',
  '/services/case-studies/callkaro/': 'Case study: voice AI agent for Hindi price checks across local stores in India. Built by Dewang Gogte.',
  '/services/case-studies/beacon/': 'Case study: autonomous equity research platform covering all 5,300 Indian listed companies. Built by Dewang Gogte.',
  '/games/': 'Free browser games. Identify watches, guess insects, and more.',
  '/projects/': 'Projects by Dewang Gogte. Stock screeners, voice AI agents, and web experiments.',
  '/resume/': 'Resume of Dewang Gogte. Startup operator based in Bangalore, India.',
  '/blog/': 'Writing about startups, projects, and things I learn along the way.',
  // DEFERRED — add when /audit/checkout/ is built (spec §3.2)
  // '/audit/checkout/': 'Complete your AI Operations Audit purchase.',
};
```

- [ ] **Step 2: Add `noindex` prop to Props interface and use it**

Find the `interface Props` block (lines 4-8) and replace with:

```ts
interface Props {
  title?: string;
  description?: string;
  jsonLD?: Record<string, unknown>;
  noindex?: boolean;
}
```

Find the destructuring line (line 10):

```ts
const { title = "Dewang Gogte", description, jsonLD } = Astro.props;
```

Replace with:

```ts
const { title = "Dewang Gogte", description, jsonLD, noindex = false } = Astro.props;
```

- [ ] **Step 3: Emit the robots meta tag when `noindex` is set**

In the `<head>` block (starting line 66), add a `<meta>` after the `<SEO ... />` element and before `</head>`:

```astro
    <SEO
      title={title}
      description={pageDescription}
      type="website"
      jsonLD={finalJsonLD}
    />
    {noindex && <meta name="robots" content="noindex, nofollow" />}
</head>
```

- [ ] **Step 4: Run build to confirm no regressions**

Run: `npm run build`
Expected: clean build. Existing pages still work — `noindex` defaults to `false`.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Base.astro
git commit -m "feat: Base.astro supports noindex prop and new page descriptions"
```

---

## Task 4: `/audit/thank-you/` page

**Why before `/audit/`:** small page, exercises the new `noindex` prop, and removes a dangling link target before we write the page that sends traffic here.

**Files:**
- Create: `src/pages/audit/thank-you.astro`

**Reference:** spec §3.3.

- [ ] **Step 1: Write the page**

```astro
---
// src/pages/audit/thank-you.astro
import Base from '../../layouts/Base.astro';
import Footer from '../../components/Footer.astro';
import CTAButton from '../../components/CTAButton.astro';
import { GOOGLE_FORM_URL } from '../../config/audit';
---

<Base title="Thanks — AI Operations Audit" noindex={true}>
  <header>
    <h1>Thanks. You're in.</h1>
  </header>

  <section class="bio">
    <p>
      Payment received. You'll get an email confirmation from PayPal in the next
      couple of minutes. Keep that handy, you'll need the Transaction ID in step 1.
    </p>

    <p>Next steps, in order.</p>

    <p>
      <strong>1. Fill the intake form.</strong><br/>
      Takes about 15 minutes. The first question asks for your PayPal Transaction
      ID so I can match your payment to your audit (it's in the PayPal receipt
      email, a string that looks like <code>1A2BC3DEF4567890G</code>). The rest is
      about your business and the processes you want looked at.
    </p>

    <div class="cta-row">
      <CTAButton
        label="Open the intake form"
        href={GOOGLE_FORM_URL}
        variant="primary"
        external
      />
    </div>

    <p>
      <strong>2. Record 2-3 Looms.</strong><br/>
      Pick the 2-3 most repetitive tasks your team does. Someone on the team
      screen-records themselves doing it (5-10 minutes each). Reply to the PayPal
      receipt email with the links.
    </p>

    <p>
      <strong>3. We'll book a 30-min understanding call.</strong><br/>
      Once your form and recordings are in, I'll email you a Calendly link for a
      short call so we can make sure I understand your processes correctly before
      starting the analysis.
    </p>

    <p>
      <strong>4. Report in 5-7 business days after that call.</strong><br/>
      PDF delivered by email, plus a link to book a 30-min review call to walk
      through it.
    </p>

    <p>If anything's unclear, reply to the receipt email. I read every one.</p>
  </section>

  <Footer links={[
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog/" }
  ]} />
</Base>

<style>
  .cta-row {
    margin: 1.5rem 0 2rem;
  }

  code {
    font-family: 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace;
    font-size: 0.85em;
    background: #f3f1ee;
    padding: 0.15em 0.35em;
    border-radius: 3px;
  }
</style>
```

**Why `<br/>` after bold headings instead of `<h3>`:** matches the project's writing-style preference recorded in MEMORY.md — "Bold headings use `<br/>` for line break, no full stops on headings."

- [ ] **Step 2: Start dev server and eyeball the page**

Run: `npm run dev`
Open: `http://localhost:4321/audit/thank-you/`
Expected:
- Page renders in the 640px serif container.
- "Open the intake form" is a rust-orange button.
- View page source — confirm `<meta name="robots" content="noindex, nofollow">` is present.
- Click the button — it goes to `TODO:GOOGLE_FORM_URL` (broken link is expected; the URL swap is Task 11).

Stop the dev server.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: clean build. Check `dist/audit/thank-you/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/audit/thank-you.astro
git commit -m "feat: post-payment thank-you page with noindex"
```

---

## Task 5: `/audit/` landing page

**Why this is the largest task:** this is the page the whole funnel converges on. It's worth getting right in one focused pass.

**Files:**
- Create: `src/pages/audit/index.astro`

**Reference:** spec §3.1 (hero, content sections, FAQ, final CTA). NOT §3.1.1 (A/B variant is DEFERRED).

- [ ] **Step 1: Write the page**

```astro
---
// src/pages/audit/index.astro
import Base from '../../layouts/Base.astro';
import Footer from '../../components/Footer.astro';
import CTAButton from '../../components/CTAButton.astro';
import { PAYPAL_LINK, CALENDLY_CALL_URL, AUDIT_PRICE_USD } from '../../config/audit';

// JSON-LD for the audit service
const auditJsonLD = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'AI Operations Audit',
  provider: {
    '@type': 'Person',
    name: 'Dewang Gogte',
    url: 'https://dewanggogte.com',
  },
  areaServed: 'Worldwide',
  description:
    'A fixed-price audit that finds 20+ hours a week of work a small-to-mid-sized business can automate with AI. Guaranteed or free.',
  offers: {
    '@type': 'Offer',
    price: String(AUDIT_PRICE_USD),
    priceCurrency: 'USD',
  },
};
---

<Base title="AI Operations Audit — $497" jsonLD={auditJsonLD}>
  <header>
    <h1>AI Operations Audit</h1>
  </header>

  <section class="bio">

    <p>
      I'll find 20+ hours a week of work your team is doing manually that AI can
      handle faster and cheaper. You'll get a prioritized list of what to
      automate, with dollar savings for each. About 10 days end-to-end, costs
      ${AUDIT_PRICE_USD}, mostly async with one 30-min call in the middle to
      make sure I've got the picture right.
    </p>

    <p>
      If I can't find at least 20 hours a week of automatable work, you don't pay.
    </p>

    <div class="cta-row">
      <CTAButton
        label={`Buy the audit ($${AUDIT_PRICE_USD})`}
        href={PAYPAL_LINK}
        variant="primary"
        external
      />
      <CTAButton
        label="30-min call first?"
        href={CALENDLY_CALL_URL}
        variant="secondary"
        external
      />
    </div>

    <h2>What you get</h2>
    <p>A single PDF, usually 8-10 pages.</p>
    <ul>
      <li>Every repetitive process your team runs today, mapped end to end.</li>
      <li>For each one: what's automatable, what isn't, and why.</li>
      <li>Time saved per week. Dollar saved per year. The math is shown.</li>
      <li>A phase 1 / phase 2 / phase 3 roadmap so you know where to start.</li>
      <li>Scoped proposals for the top 3 things worth building first, if you want to hire someone to do it.</li>
    </ul>
    <p>Plus a 30-min review call once the report lands.</p>

    <h2>How it works</h2>
    <p>Four steps. Three async, one quick call. No discovery calls, no kickoff meetings.</p>
    <p>
      <strong>1. Pay + fill the intake form.</strong><br/>
      Takes 15 minutes. Ten questions about your business, your team, the tools
      you use, and the processes that bug you most. Delivered two ways: linked on
      the thank-you page right after payment, and sent to your inbox so you can
      fill it whenever.
    </p>
    <p>
      <strong>2. Record 2-3 Looms.</strong><br/>
      Five-to-ten minutes each. Someone on your team screen-records the
      repetitive tasks. You send me the links.
    </p>
    <p>
      <strong>3. A 30-min understanding call.</strong><br/>
      Once the form and the Looms are in, we hop on a short call so I can make
      sure I've understood your processes correctly before sitting down to
      analyze them. This step is the difference between a useful report and a
      generic one.
    </p>
    <p>
      <strong>4. You get a report within 5-7 business days of that call.</strong><br/>
      PDF delivered by email. 30-min review call to walk through it if you want one.
    </p>

    <h2>Who this is for</h2>
    <p>
      Small to mid-sized businesses where people are doing repetitive digital
      work at volume. Home services companies, staffing agencies, property
      managers, vet clinics, moving companies, accounting firms, small
      e-commerce ops, early-stage startups.
    </p>
    <p>
      Anywhere between 5 and 50 people. Anywhere in the world, though most of my
      clients are in the US and UK.
    </p>
    <p>
      If your team's day involves a lot of copying data between systems, sending
      the same follow-ups, processing documents by hand, or chasing people for
      information, the audit will find things.
    </p>

    <h2>Who this isn't for</h2>
    <ul>
      <li>Solo operators or 1-2 person teams. You don't have the volume yet.</li>
      <li>Pure physical labor businesses with no digital workflow.</li>
      <li>Companies with a full in-house tech team already building automation. You don't need an outside perspective.</li>
      <li>Anyone looking for a free consultation or a "let's just chat" meeting. This is a paid, scoped engagement.</li>
    </ul>

    <h2>The guarantee</h2>
    <p>
      If I can't find at least 20 hours a week of work across your team that AI
      could realistically automate, you get a full refund. No questions, no
      paperwork.
    </p>
    <p>
      I've never not hit this number on a business with 5+ people. The
      guarantee is there so you can say yes without second-guessing.
    </p>

    <h2>What I've built</h2>
    <p>Two examples of the kind of systems I build end to end:</p>
    <p>
      <strong><a href="/services/case-studies/callkaro/">CallKaro</a>.</strong>
      Voice AI agent that calls Indian local stores in Hindi and collects price
      quotes. 214 automated tests, sub-2-second turn latency, deployed on
      Kubernetes.
    </p>
    <p>
      <strong><a href="/services/case-studies/beacon/">Beacon</a>.</strong>
      Autonomous equity research platform covering all 5,300 listed Indian
      companies, with a 4-agent LLM pipeline layered on top of quantitative
      scoring.
    </p>
    <p>Both are public on GitHub. More on <a href="/services/">what I do</a>.</p>

    <h2>About me</h2>
    <p>
      I'm a freelance AI and automation engineer. I've spent the last few years
      at Iden (Accel-backed), Drip Capital (YC + Accel), and American Express,
      mostly at the intersection of product, data, and operations. Studied
      Biotech and AI at IIT Kharagpur.
    </p>
    <p>
      More on the <a href="/services/">services page</a> or
      <a href="/resume/">my resume</a>.
    </p>

    <h2>FAQ</h2>
    <p>
      <strong>What if we already use Zapier / Make / some automation tool?</strong><br/>
      Good. Means you've done some of the easy stuff. The audit looks for work
      that those tools can't handle on their own. Things that need an LLM, a
      custom agent, or a workflow that spans tools without clean APIs.
    </p>
    <p>
      <strong>What tech do you actually build with?</strong><br/>
      Python and TypeScript mostly. Claude and GPT for the LLM layer. Whatever
      glue is appropriate for the problem (Retool, n8n, custom scripts, browser
      automation, direct API integrations). I pick tools that are cheap to
      maintain, not trendy.
    </p>
    <p>
      <strong>Do you sign NDAs?</strong><br/>
      Yes, happy to.
    </p>
    <p>
      <strong>What happens after the audit?</strong><br/>
      If you want to hire me to build the top items, we scope and price them
      separately. If you don't, the report is yours to keep and hand to anyone.
      Freelancer, agency, or in-house hire. No clawback.
    </p>
    <p>
      <strong>How do I know the audit isn't just a lead magnet?</strong><br/>
      Because you pay for it upfront, and I guarantee the hours-saved number. If
      it's worthless, you get your money back.
    </p>
    <p>
      <strong>What if my team is too busy to record Looms?</strong><br/>
      Then the 30-min understanding call we're already scheduled to have becomes
      a working session. Someone walks through the workflows over screen-share
      while I watch, same as a Loom. No extra cost, same deliverable at the end.
    </p>
    <p>
      <strong>What if we want to pay by wire transfer instead of card?</strong><br/>
      Happy to send a Wise Business invoice with US bank details. Usually a
      better rate than card for invoices over a few thousand dollars, though at
      ${AUDIT_PRICE_USD} the difference is small. Reply to the outreach email and
      I'll send a wire invoice instead of the PayPal link.
    </p>

    <h2>Ready?</h2>
    <p>
      ${AUDIT_PRICE_USD} for the audit. 7 days to the report. 20 hours a week
      guaranteed or your money back.
    </p>

    <div class="cta-row">
      <CTAButton
        label="Buy the audit"
        href={PAYPAL_LINK}
        variant="primary"
        external
      />
      <CTAButton
        label="Or book a 30-min call first"
        href={CALENDLY_CALL_URL}
        variant="secondary"
        external
      />
    </div>

  </section>

  <Footer links={[
    { label: "Services", href: "/services/" },
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog/" },
    { label: "Resume", href: "/resume/", external: true }
  ]} />
</Base>

<style>
  .cta-row {
    margin: 1.5rem 0 2.5rem;
  }

  .bio h2 {
    font-size: 1.25rem;
    font-weight: 500;
    margin-top: 2.5rem;
    margin-bottom: 0.75rem;
  }

  .bio ul {
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .bio li {
    margin-bottom: 0.5rem;
  }
</style>
```

**Notes on copy choices:**
- Spec hero says "embedded on the thank-you page right after payment". Since we dropped the iframe (spec §3.3 DROPPED), the line has been lightly edited to "linked on the thank-you page" — matches current reality without changing intent.
- All em-dashes replaced with periods, commas, or parentheses (spec §8 voice rule).
- No "game-changing", "leverage", "seamless" — spec §8 voice rule.

- [ ] **Step 2: Dev-server eyeball**

Run: `npm run dev`
Open: `http://localhost:4321/audit/`
Expected:
- Fits the 640px container.
- Two CTAs in the hero, sitting side-by-side on desktop, stacking on mobile (resize browser below 480px to check).
- All case-study and services links go to their target routes (they'll 404 until Tasks 6-8 land — that's fine for this check, just confirm the hrefs are correct).
- View page source — confirm JSON-LD `<script type="application/ld+json">` block is present, and `Service` and `$497` appear inside.

Stop the dev server.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: clean build. `dist/audit/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/audit/index.astro
git commit -m "feat: /audit/ landing page"
```

---

## Task 6: `/services/` overview page

**Files:**
- Create: `src/pages/services/index.astro`

**Reference:** spec §3.4. Source content is the spec itself (pricing, case-study short list, how-to-start). The older `services_page.md` referenced in the spec header is NOT authoritative — the spec's inline copy wins.

- [ ] **Step 1: Write the page**

```astro
---
// src/pages/services/index.astro
import Base from '../../layouts/Base.astro';
import Footer from '../../components/Footer.astro';
import CTAButton from '../../components/CTAButton.astro';
import { CALENDLY_CALL_URL, AUDIT_PRICE_USD } from '../../config/audit';
---

<Base title="Services — Dewang Gogte">
  <header>
    <h1>Services</h1>
  </header>

  <section class="bio">

    <p>
      I'm a freelance AI and automation engineer based in Bangalore. I work with
      businesses that have a lot of repetitive operational work sitting on their
      team's plate, and I either audit it, automate it, or embed in the team to
      do both. Most of my clients are in the US and UK, some in India.
    </p>

    <h2>AI agents and automation</h2>
    <p>
      The core of what I do. The kind of work that an LLM plus a well-designed
      pipeline can take over from a human.
    </p>
    <p>
      <strong>Workflow automation.</strong><br/>
      The repetitive stuff. Quote generation, inbox triage, appointment
      reminders, invoice chasing, lead enrichment. Usually a mix of scripts, a
      light LLM layer, and glue between whatever tools you already use.
    </p>
    <p>
      <strong>Document processing.</strong><br/>
      Extracting structured data from PDFs, invoices, contracts, forms. Usually
      a vision LLM plus a validation pass plus a human-in-the-loop fallback for
      the edge cases that matter.
    </p>
    <p>
      <strong>Voice pipelines.</strong><br/>
      Inbound or outbound voice agents. Good for high-volume, low-complexity
      calls: price checks, appointment booking, follow-ups, survey collection.
      See the CallKaro case study below for an end-to-end example.
    </p>
    <p>
      <strong>Internal tools that replace a spreadsheet.</strong><br/>
      When a team has grown past the Google Sheet that was meant to hold the
      business together. Small web apps, Retool dashboards, CLI tools.
    </p>

    <h2>Product consulting</h2>
    <p>
      For founders with too many ideas and not enough clarity on what to build
      first. I run a structured discovery, give you a scoped roadmap, and usually
      stay on to help ship the first thing. Half of my Iden and Drip Capital
      work looked like this.
    </p>

    <h2>Fractional ops / founder's office</h2>
    <p>
      Embedded, not advising. I sit in your team's Slack, own a slice of the
      automation roadmap, and report into the founder or COO. Good for
      early-stage companies that need the output of a senior operator without
      the salary.
    </p>

    <h2>What I've built</h2>
    <p>
      <strong><a href="/services/case-studies/callkaro/">CallKaro: voice AI for Hindi price checks</a>.</strong>
      Autonomous agent that calls local Indian stores in Hindi and Hinglish and
      collects structured price quotes. Built for retail intelligence and market
      research use cases.
    </p>
    <p>
      <strong><a href="/services/case-studies/beacon/">Beacon: autonomous equity research at scale</a>.</strong>
      Platform that scrapes and scores all 5,300 listed Indian companies, with a
      4-agent LLM pipeline producing independent qualitative analysis on top.
    </p>
    <p>
      Both are public on GitHub. Individual case studies cover the problem, what
      was built, the hard parts, and what a client engagement in that space
      would look like.
    </p>

    <h2>Pricing</h2>
    <p>Straight numbers, no discovery-phase billing.</p>
    <p>
      <strong>AI Operations Audit.</strong><br/>
      ${AUDIT_PRICE_USD}. One-time. About 10 days end-to-end.
      <a href="/audit/">More details</a>.
    </p>
    <p>
      <strong>Implementation projects.</strong><br/>
      $1,500 to $10,000 depending on scope. A simple workflow automation is not
      the same as a full voice agent system. We figure out the number after I
      understand the problem.
    </p>
    <p>
      <strong>Monthly retainer.</strong><br/>
      $3,000 to $6,000 per month. 15-20 hours a week. Good for businesses with a
      backlog of things to fix, or teams replacing repetitive work currently
      handled by an offshore BPO partner.
    </p>
    <p>
      <strong>Fractional AI operations.</strong><br/>
      $5,000 to $10,000 per month. Embedded in your team, owning the automation
      roadmap. Not advising. Doing.
    </p>

    <h2>How to start</h2>
    <p>
      Easiest path: buy the <a href="/audit/">AI Operations Audit</a>. Mostly
      async, about 10 days end-to-end (includes one 30-min call to make sure
      I've got the picture right), ${AUDIT_PRICE_USD}, money-back if I can't find
      at least 20 hours a week of automatable work.
    </p>
    <p>If you'd rather talk first, book a call.</p>

    <div class="cta-row">
      <CTAButton
        label={`Buy the audit ($${AUDIT_PRICE_USD})`}
        href="/audit/"
        variant="primary"
      />
      <CTAButton
        label="Book a call"
        href={CALENDLY_CALL_URL}
        variant="secondary"
        external
      />
    </div>

  </section>

  <Footer links={[
    { label: "Audit", href: "/audit/" },
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog/" },
    { label: "Projects", href: "/projects/" },
    { label: "Resume", href: "/resume/", external: true }
  ]} />
</Base>

<style>
  .cta-row {
    margin: 1.5rem 0 2.5rem;
  }

  .bio h2 {
    font-size: 1.25rem;
    font-weight: 500;
    margin-top: 2.5rem;
    margin-bottom: 0.75rem;
  }
</style>
```

**Note on the "Book a call" CTA:** spec §3.4 ends with "If you'd rather talk first, [book a call](https://calendly.com/...)." The bare anchor wouldn't be as visually strong as a button, so I've promoted it to a CTA-row alongside the audit CTA. This matches how the audit page and case studies end.

- [ ] **Step 2: Dev-server eyeball**

Run: `npm run dev`
Open: `http://localhost:4321/services/`
Expected: page renders, CTAs at the bottom, all case-study and audit links route correctly.

Stop the dev server.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/pages/services/index.astro
git commit -m "feat: /services/ overview page"
```

---

## Task 7: CallKaro case study

**Files:**
- Create: `src/pages/services/case-studies/callkaro.mdx`
- Read-only: `/Users/dg/lab/job_apps/case_studies/callkaro_case_study.md` (source content to port)

**Reference:** spec §3.5.

- [ ] **Step 1: Read the source content**

Read the file at `/Users/dg/lab/job_apps/case_studies/callkaro_case_study.md`. Use the `Read` tool on that absolute path.

- [ ] **Step 2: Create the page**

Create `src/pages/services/case-studies/callkaro.mdx` with this frontmatter + structure:

```mdx
---
layout: ../../../layouts/BlogPost.astro
title: "CallKaro: voice AI for Hindi price checks"
date: "April 24, 2026"
type: "project"
description: "Case study: voice AI agent for Hindi price checks across local stores in India. Built by Dewang Gogte."
---

import CTAButton from '../../../components/CTAButton.astro';
import { PAYPAL_LINK, CALENDLY_CALL_URL, AUDIT_PRICE_USD } from '../../../config/audit';

{/* PASTE: the body content from /Users/dg/lab/job_apps/case_studies/callkaro_case_study.md,
   ported verbatim. Apply the voice rules:
   - Remove em-dashes (spec §8). Replace with period, comma, or parentheses.
   - Sentence-case headings.
   - No corporate-speak.

   Keep the H1 out of the body (BlogPost.astro already renders the title in its header).
   Start the body with the opening paragraph. Use H2/H3 as needed. */}

## For potential clients

If you're evaluating whether a voice agent is worth building for your business,
this is the kind of system I can build end-to-end. A good starting point is the
[AI Operations Audit](/audit/): I'll look at your team's current manual work and
tell you whether voice, chat, document processing, or something else is the
highest-value place to automate first.

The deep technical writeup of CallKaro is on the
[blog](/blog/projects/building-callkaro/).

<div class="cta-row">
  <CTAButton label={`Buy the audit ($${AUDIT_PRICE_USD})`} href={PAYPAL_LINK} variant="primary" external />
  <CTAButton label="Book a call" href={CALENDLY_CALL_URL} variant="secondary" external />
</div>

<style>
  .cta-row {
    margin: 2rem 0 1rem;
  }
</style>
```

**Porting rules** (apply while filling the `{/* PASTE: ... */}` block):

1. Open `/Users/dg/lab/job_apps/case_studies/callkaro_case_study.md` and copy the body (everything after any H1 title). Paste it in place of the `{/* PASTE: ... */}` comment.
2. Remove the H1 if present at the top of the source (the BlogPost layout already emits one from frontmatter).
3. Search for em-dashes (`—`) and replace each with period, comma, or parentheses based on the sentence.
4. Keep existing markdown syntax (headings, lists, links, code blocks). MDX renders them natively.
5. If the source has its own "For clients" or "Contact" section, delete it — the CTA block at the bottom of the page replaces it.

- [ ] **Step 3: Dev-server eyeball**

Run: `npm run dev`
Open: `http://localhost:4321/services/case-studies/callkaro/`
Expected:
- Page uses the BlogPost layout (wider 800px container, back-to-blog link in header). The back-to-blog link is a known limitation, see "Followups" at the end of this plan.
- Title = "CallKaro: voice AI for Hindi price checks" in the header.
- CTA block at the bottom with two buttons.
- Internal link to `/blog/projects/building-callkaro/` resolves.

Stop the dev server.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: clean build. `dist/services/case-studies/callkaro/index.html` exists.

- [ ] **Step 5: Commit**

```bash
git add src/pages/services/case-studies/callkaro.mdx
git commit -m "feat: CallKaro case study page"
```

---

## Task 8: Beacon case study

**Files:**
- Create: `src/pages/services/case-studies/beacon.mdx`
- Read-only: `/Users/dg/lab/job_apps/case_studies/beacon_case_study.md`

**Reference:** spec §3.6. Structure is identical to Task 7 with Beacon content.

- [ ] **Step 1: Read the source content**

Read `/Users/dg/lab/job_apps/case_studies/beacon_case_study.md`.

- [ ] **Step 2: Create the page**

Create `src/pages/services/case-studies/beacon.mdx` with this frontmatter + structure:

```mdx
---
layout: ../../../layouts/BlogPost.astro
title: "Beacon: autonomous equity research at scale"
date: "April 24, 2026"
type: "project"
description: "Case study: autonomous equity research platform covering all 5,300 Indian listed companies. Built by Dewang Gogte."
---

import CTAButton from '../../../components/CTAButton.astro';
import { PAYPAL_LINK, CALENDLY_CALL_URL, AUDIT_PRICE_USD } from '../../../config/audit';

{/* PASTE: the body content from /Users/dg/lab/job_apps/case_studies/beacon_case_study.md,
   ported verbatim. Follow the same porting rules as Task 7:
   - Remove the source H1 (BlogPost layout renders its own).
   - Replace em-dashes with period, comma, or parentheses.
   - Keep existing markdown syntax.
   - Delete any source-file "For clients" / "Contact" section — replaced by the CTA block below. */}

## For potential clients

If you're evaluating whether a data-gathering + LLM-analysis pipeline is worth
building for your research workflow, this is the kind of system I can build
end-to-end. A good starting point is the
[AI Operations Audit](/audit/): I'll look at your team's current research and
analysis process and tell you where automation is likely to pay off fastest.

The deep technical writeup of Beacon is on the
[blog](/blog/projects/building-beacon/).

<div class="cta-row">
  <CTAButton label={`Buy the audit ($${AUDIT_PRICE_USD})`} href={PAYPAL_LINK} variant="primary" external />
  <CTAButton label="Book a call" href={CALENDLY_CALL_URL} variant="secondary" external />
</div>

<style>
  .cta-row {
    margin: 2rem 0 1rem;
  }
</style>
```

- [ ] **Step 3: Dev-server eyeball**

Run: `npm run dev`
Open: `http://localhost:4321/services/case-studies/beacon/`
Expected: same as Task 7 — BlogPost layout, correct title, CTA block at bottom.

Stop the dev server.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src/pages/services/case-studies/beacon.mdx
git commit -m "feat: Beacon case study page"
```

---

## Task 9: Home page rewrite

**Files:**
- Modify: `src/pages/index.mdx`

**Reference:** spec §3.7.

- [ ] **Step 1: Rewrite `src/pages/index.mdx`**

Replace the entire file contents with:

```mdx
---
layout: ../layouts/Base.astro
title: Dewang Gogte
---
import Footer from '../components/Footer.astro';

<header>
    <h1>Dewang Gogte</h1>
    <p class="location">Bangalore, India</p>
</header>

<div class="available">
    <a href="/services/">Open to freelance, consulting & part-time work</a>
</div>

<section class="bio">

I help businesses automate the repetitive operational work their teams are doing by hand. That usually means AI agents, document processing, voice pipelines, or internal tools that replace a spreadsheet. Sometimes it's product consulting for founders who have too many ideas and not enough clarity on what to build first.

Before this, I was at Iden (Accel), Drip Capital (YC + Accel), and American Express. Studied Biotech and AI at IIT Kharagpur.

If you run a business with manual operational work that could be automated, I run a fixed $497 [AI Operations Audit](/audit/). About 10 days end-to-end, mostly async, money-back if I can't find at least 20 hours a week of automatable work.

This site is a place to share my thoughts, projects, and some [photos](https://instagram.com/dewangraphy) and [music](https://open.spotify.com/user/iwg7ch1br16aowx3t2sankj9a). More of all that over time.

</section>

<Footer links={[
    { label: "Services", href: "/services/" },
    { label: "Audit", href: "/audit/" },
    { label: "Blog", href: "/blog/" },
    { label: "Projects", href: "/projects/" },
    { label: "Games", href: "/games/" },
    { label: "Resume", href: "/resume/", external: true }
]} />
```

**Why `<a>` inside the `.available` div:** the existing CSS styles `.available` (color, font-size, the green dot). Wrapping the text in an `<a>` preserves the pill styling and only changes the text colour to accent (from the global `a` rule). No additional CSS needed.

**Ampersand note:** the pill copy reads "freelance, consulting & part-time work". In MDX inside JSX context the `&` is fine — it's not HTML-entity-encoded. Build will confirm.

- [ ] **Step 2: Dev-server eyeball**

Run: `npm run dev`
Open: `http://localhost:4321/`
Expected:
- Availability pill is now a link — hovering underlines it, clicking goes to `/services/`.
- New bio is in place, including the audit paragraph with a link to `/audit/`.
- Footer has six links: Services, Audit, Blog, Projects, Games, Resume (external).

Stop the dev server.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.mdx
git commit -m "feat: homepage rewrite for freelance positioning"
```

---

## Task 10: Sitemap updates

**Files:**
- Modify: `astro.config.mjs`

**Reference:** spec §3.9.

- [ ] **Step 1: Update the config**

Open `astro.config.mjs`. Replace the `lastModDates` object (currently lines 6-19) with:

```js
// Map of URLs to their last significant content update
const lastModDates = {
  'https://dewanggogte.com/': '2026-04-24',
  'https://dewanggogte.com/audit/': '2026-04-24',
  'https://dewanggogte.com/services/': '2026-04-24',
  'https://dewanggogte.com/services/case-studies/callkaro/': '2026-04-24',
  'https://dewanggogte.com/services/case-studies/beacon/': '2026-04-24',
  'https://dewanggogte.com/blog/': '2026-03-17',
  'https://dewanggogte.com/blog/til/why_til_26-01-2026/': '2026-01-26',
  'https://dewanggogte.com/blog/til/hosting-your-own-website/': '2026-02-24',
  'https://dewanggogte.com/blog/til/custom-domain-email/': '2026-02-24',
  'https://dewanggogte.com/blog/til/voice-mode-in-claude-code/': '2026-02-27',
  'https://dewanggogte.com/blog/projects/building-this-site/': '2026-02-17',
  'https://dewanggogte.com/blog/projects/building-callkaro/': '2026-02-17',
  'https://dewanggogte.com/blog/projects/building-beacon/': '2026-03-17',
  'https://dewanggogte.com/games/': '2026-03-17',
  'https://dewanggogte.com/projects/': '2026-04-24',
  'https://dewanggogte.com/resume/': '2026-04-24',
};
```

Then replace the `sitemap({...})` call (currently lines 26-38) with:

```js
    sitemap({
      filter: (page) => !page.includes('/audit/thank-you'),
      // DEFERRED — when /audit/checkout/ is built (spec §3.2), extend to:
      // filter: (page) => !page.includes('/audit/checkout') && !page.includes('/audit/thank-you'),
      customPages: [
        'https://dewanggogte.com/games/bugs/',
        'https://dewanggogte.com/games/watchguessr/',
      ],
      serialize(item) {
        const lastmod = lastModDates[item.url];
        if (lastmod) {
          item.lastmod = new Date(lastmod).toISOString();
        }
        return item;
      },
    }),
```

- [ ] **Step 2: Build and verify the sitemap**

Run: `npm run build`
Expected: clean build.

Then open `dist/sitemap-0.xml` (or whatever the sitemap file is named in `dist/`). Use the Read tool.

Expected:
- `/audit/`, `/services/`, `/services/case-studies/callkaro/`, `/services/case-studies/beacon/` all appear.
- `/audit/thank-you/` does NOT appear.
- `lastmod` on `/audit/` is `2026-04-24T...`.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: sitemap includes new audit and services routes"
```

---

## Task 11: Replace the Google Form URL placeholder

**When to do this:** only after the Google Form is created per pipeline spec §11.3. PayPal and Calendly URLs are already wired in Task 1. Only `GOOGLE_FORM_URL` remains as a `TODO:` string.

**Files:**
- Modify: `src/config/audit.ts`

- [ ] **Step 1: Obtain the Google Form URL**

Paste the real shareable URL here:
- `GOOGLE_FORM_URL` = `<paste URL>`

- [ ] **Step 2: Replace in `src/config/audit.ts`**

Edit `src/config/audit.ts`. Change `'TODO:GOOGLE_FORM_URL'` to the real URL. Keep the variable name.

- [ ] **Step 3: Grep-sweep for stragglers**

Run: `grep -r "TODO:" src/`
Expected: zero results. If any `TODO:` strings remain, they were missed — fix them.

- [ ] **Step 4: Production build + spot check**

Run: `npm run build`
Expected: clean build.

Then `npm run dev`, visit `/audit/thank-you/`, click "Open the intake form", confirm it opens the real Google Form in a new tab.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/config/audit.ts
git commit -m "feat: wire real Google Form URL for intake"
```

---

## Task 12: End-to-end manual verification

**When to do this:** after Task 11 (real URLs wired) and before merging/deploying.

**Files:** none changed in this task — it's a verification pass.

- [ ] **Step 1: Fresh production build and preview**

Run: `npm run build && npm run preview`
Open: `http://localhost:4321/` (or whatever port `astro preview` reports).

- [ ] **Step 2: Click through the funnel**

Walk every path:

- [ ] From `/`, click the availability pill → lands on `/services/`.
- [ ] From `/`, click the "AI Operations Audit" link in the bio → lands on `/audit/`.
- [ ] From `/`, click each footer link → correct destination.
- [ ] From `/audit/`, click the primary hero CTA → opens PayPal in a new tab at the correct $497 link.
- [ ] From `/audit/`, click the secondary hero CTA → opens Calendly 30-min event in a new tab.
- [ ] From `/audit/`, click the CallKaro link → lands on `/services/case-studies/callkaro/`.
- [ ] From `/audit/`, click the Beacon link → lands on `/services/case-studies/beacon/`.
- [ ] From `/audit/`, scroll to the bottom CTAs → both work.
- [ ] Visit `/audit/thank-you/` directly → the "Open the intake form" button opens the Google Form in a new tab.
- [ ] From `/services/`, click the audit CTA → lands on `/audit/`.
- [ ] From `/services/`, click the "Book a call" CTA → opens Calendly.
- [ ] From `/services/case-studies/callkaro/`, scroll to the CTA block → both buttons route correctly.
- [ ] From `/services/case-studies/beacon/`, scroll to the CTA block → both buttons route correctly.

- [ ] **Step 3: Mobile layout check**

Open each page (`/`, `/audit/`, `/audit/thank-you/`, `/services/`, both case studies) in browser devtools with width ≤ 480px.
Expected: container padding reduces to 2rem/1.25rem; CTA buttons stack vertically.

- [ ] **Step 4: Noindex check**

View page source on `/audit/thank-you/` → `<meta name="robots" content="noindex, nofollow">` is present.
View page source on `/audit/` → that meta is NOT present.

- [ ] **Step 5: Sitemap check**

Open `dist/sitemap-0.xml` (or whatever the generated sitemap file is).
Expected: `/audit/`, `/services/`, both case-study URLs present; `/audit/thank-you/` absent.

- [ ] **Step 6: Voice pass**

Open the `humanizer` skill (referenced in spec §8) and run it on `/audit/index.astro` copy. Fix anything flagged as AI-generated cadence.

Stop the preview server.

- [ ] **Step 7: Final commit if the voice pass changed anything**

```bash
git add src/pages/audit/index.astro
git commit -m "edit: tighten /audit/ copy per humanizer pass"
```

(If the humanizer pass made no changes, skip this step.)

---

## Followups (not part of this plan)

Things observed during planning that should become separate issues, not scope creep inside this plan:

1. **BlogPost layout has a "Back to Blog" link in its header** that shows on case-study pages too. Not worth blocking launch, but ideally `BlogPost.astro` should accept a `backLink` prop (e.g., `{ label: string; href: string }`) so case studies can say "Back to Services" instead. File as a followup.

2. **OG image for `/audit/`** — spec §5 describes a custom `og-audit.png`. Marked "low priority for launch" in the spec. Default OG image is fine for week 1. File as a followup.

3. **When >10 audits delivered** — revisit the scope restrictions in spec §6 (testimonials, client logos, video, chat, newsletter, pricing calculator, ROI quiz, gated PDFs). The spec says "revisit after 10 audits delivered". Tag this in whatever tracker Dewang uses.

4. **A/B price test re-enable** — when ready, see spec §3.1.1 and §3.2 (both DEFERRED). The `src/config/audit.ts` module makes the single-price assumption explicit, which is a good anchor point for the re-enable work.

---

## Self-review checklist (done)

**Spec coverage.** Every section of `spec_website_changes.md` that applies to the ACTIVE path maps to a task:

| Spec section | Task |
|---|---|
| §2 Information architecture | Covered by Tasks 4-8 (all new routes created) |
| §3.1 `/audit/` | Task 5 |
| §3.1.1 A/B variant | DEFERRED (called out in plan header) |
| §3.2 `/audit/checkout/` | DEFERRED (called out in plan header) |
| §3.3 `/audit/thank-you/` | Task 4 |
| §3.4 `/services/` | Task 6 |
| §3.5 CallKaro case study | Task 7 |
| §3.6 Beacon case study | Task 8 |
| §3.7 Home page rewrite | Task 9 |
| §3.8 Base.astro SEO updates | Task 3 |
| §3.9 Sitemap updates | Task 10 |
| §3.10 CTAButton component | Task 2 |
| §4 Build + deployment | Inherent — no changes needed |
| §4 "URLs to obtain" | Task 1 (placeholders) + Task 11 (real URLs) |
| §5 OG image | Deferred to followups (low priority in spec) |
| §6 What NOT to add | Respected — no testimonials, logos, newsletter, etc. |
| §7 Implementation order | This plan matches steps 1-9 of §7 |
| §8 Voice check | Task 12 Step 6 (humanizer pass) |

**Placeholder scan.** No "TBD", "TODO later", or "Similar to Task N" in task bodies. The only `TODO:` string remaining is `TODO:GOOGLE_FORM_URL` — explicitly named, with Task 11 dedicated to replacing it.

**Type consistency.** `CTAButton` is referenced with the same four props (`label`, `href`, `variant`, `external`) across Tasks 2, 4, 5, 6, 7, 8. `src/config/audit.ts` exports the same three names (`PAYPAL_LINK`, `CALENDLY_CALL_URL`, `GOOGLE_FORM_URL`) that every importing task uses. `AUDIT_PRICE_USD` is used consistently in Tasks 5, 6, 7, 8.
