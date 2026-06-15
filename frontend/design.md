for the frontend landing pages : 

# WorkforceOS — Landing Page Design & Build Instructions
> For an AI agent or developer. No code here. Pure design intent, spatial layout, copy direction, and visual logic for every section of every page.

---

## Who This Is For and What They Must Do

Read this entire document before making any decisions. Every section explains not just *what* to build but *why* it's designed that way and *exactly* how each element relates to the others spatially. If a detail is not in this document, default to restraint — add nothing decorative unless it serves the copy or the conversion goal.

---

## The Product and the Goal

WorkforceOS is a modular HRMS SaaS platform for Indian companies — attendance, leave, tasks, payroll, performance, expenses, and more, all under one roof. The people visiting this page are HR managers, founders, and operations heads at companies of 20–500 employees. They are evaluating whether this product can replace their spreadsheets, WhatsApp groups, and manual processes.

The page has exactly one conversion goal: get the visitor to submit the contact form so the founder can reach out, schedule a demo, and close the sale personally. There is no self-serve signup. There is no pricing. Every call to action on every page leads to that form.

The tone is confident and direct — not hype, not corporate. Written the way a knowledgeable founder would talk to a potential customer over chai. Specific, honest, Indian-business-aware.

---

## Visual Identity

### Colour

The palette is built around a dominant near-black (`#0F1117`), an off-white content surface (`#F8F9FC`), a strong brand blue (`#2563EB`), and a sky accent (`#0EA5E9`). Supporting colours are muted slate for secondary text, a light border tone, and occasional success green.

The signature structural choice: the hero section and footer are the dark near-black. Every content section between them is the off-white surface. This creates a visual frame — the page opens dark, opens up into light, and closes dark again. It feels premium without being trendy. It avoids the blank-white SaaS default without committing to a full dark-mode aesthetic.

Blue is used for primary actions, links, active states, and eyebrow labels. It should feel like authority and clarity, not decoration. Never use blue for body copy.

### Typography

Three typefaces, each with a distinct job:

**Plus Jakarta Sans** is the personality face. It is used for every headline and every card title. It has geometric warmth and high legibility at large sizes. Set heavy (700 or 800 weight) for headlines, 600 for card titles. Always tight letter-spacing (−0.02em to −0.03em) and tight line-height (1.08 to 1.2) on headlines — this is what makes them feel designed rather than default.

**Inter** is the workhorse face. Every body paragraph, label, caption, button, input field, and secondary UI element. Clean and invisible in the best sense. Weight 400 for body, 500 for labels and button text.

**JetBrains Mono** appears only in data contexts — employee IDs shown in feature screenshots, code-like stats, technical credibility sections. It signals that the product is engineered, not just marketed.

### Spacing

Every spatial decision is based on a multiple of 8px. The white space between sections is generous — 96px top and bottom on desktop. This is deliberate. B2B SaaS pages that cram content signal cheapness. Let sections breathe.

---

## Global Navigation

### What It Contains

Left side: the WorkforceOS wordmark logotype only — no icon, no tagline alongside it. The name itself is the brand here.

Right side: three text links — Features, About, Contact — followed immediately by one button — "Request a demo."

No dropdowns. No mega-menus. No search.

### Desktop Behaviour

The nav is fixed to the top and stays there as the user scrolls. It starts fully transparent so it bleeds into the hero. After the user has scrolled 60px downward, it picks up a very dark semi-transparent background with a blur — like frosted glass in near-black. The transition between these two states is smooth, about 300ms.

The three text links are in white at full opacity with 80% opacity as their resting state. On hover they go to full white. No underlines. The gap between the three links should feel airy — at least 32px between each.

The "Request a demo" button is the one element in the nav that has a background. It is brand blue with white text and fully rounded corners. It should feel like the only actionable thing in the nav. Its padding should make it taller than the text links by a noticeable amount (approximately 10px top-bottom padding) so it reads as a button without being oversized.

The entire nav is 64px tall. The logo and links are vertically centered within it.

On pages that are not the homepage (Features, About, Contact) the nav starts with a light blurred background immediately — because those pages do not have a dark hero. On those pages, the logo text and nav links are near-black, not white.

### Mobile Behaviour

Below 768px, the three text links and the CTA button completely disappear. Only the logo (left) and a hamburger icon (right) remain. The hamburger is three horizontal bars, each 22px wide and 3px tall, spaced 5px apart. Tapping it opens a full-screen overlay that slides in from the right edge. The overlay is near-black and covers the entire viewport.

Inside the overlay, the four destinations (Features, About, Contact, and a full-width "Request a demo" button at the bottom) are stacked vertically, centered horizontally, with at least 40px between each link. Link text is large — approximately 2rem — in Plus Jakarta Sans 700, white. The "Request a demo" button at the bottom is the same brand blue as desktop, full width, prominent.

A close icon (×) appears in the same position as the hamburger was. Tapping anywhere outside the links closes the overlay.

---

## Page: index.html — Homepage

This is the conversion page. Every section exists to bring the visitor one step closer to the contact form at the bottom. The structure is: create resonance (they feel understood) → demonstrate value (they see what the product does) → build trust (they believe it works) → ask for commitment (the form).

---

### Section 1 — Hero

**Background:** Near-black (`#0F1117`). Full viewport height — the entire visible area on first load is this section. A very subtle dot-grid or line-grid pattern sits on the background at very low opacity (about 3%) to add depth without visible texture. This is not a gradient sky, not a blob, not a photo background. Just structured dark geometry.

**Layout:** Everything in this section is horizontally centered. The content column is constrained to a maximum width of 760px and sits in the exact vertical center of the viewport. There is generous empty space above and below the content.

**Content, top to bottom, with spacing:**

The first element is a small pill-shaped label that floats above the headline. It has a blue background at very low opacity (about 8% blue), a thin blue border, and the text is in the sky accent colour. All-caps, small size (13px), tracked out. The text reads something like: `WORKFORCE MANAGEMENT FOR INDIAN BUSINESSES`. This pill is horizontally centered. It sits 0px above the headline with 16px of gap between them.

The headline sits directly below. It is the single most important typographic moment on the entire site. It is in Plus Jakarta Sans 800, as large as the viewport allows while staying readable (use a fluid size between 3rem and 4.5rem). The text is pure white. Letter spacing is very tight, −0.03em. Line height is 1.08 — the lines are nearly touching. The headline should be no more than two lines. It reads: **"Run your entire team from one place."** The word "entire" can be in the sky accent colour or underlined with a blue line underneath to add visual interest — but only if it doesn't look gimmicky. If in doubt, keep it all white.

Below the headline, after 20px of gap, the subheadline. This is Inter 400, approximately 1.2rem, in white at 65% opacity. It should be no more than two lines. Maximum width 560px, centered. It reads: **"WorkforceOS handles attendance, tasks, leaves, payroll, and performance — built for the way Indian companies actually operate."**

Below the subheadline, after 40px of gap, the CTA row. Two buttons, side by side, horizontally centered. The first button is brand blue, white text, fully rounded — "Request a demo". The second is a ghost button — transparent with a white border at 40% opacity, white text, fully rounded — "See all modules". Both buttons are the same height (approximately 52px). The gap between them is 16px. On mobile these stack vertically, each full-width, with 12px between.

Below the CTA row, after 56px of gap, a social proof strip. This is a single horizontal line of elements. On the left, a small text label in white at 45% opacity: "Trusted by teams across". Then four small company-name chips — these are very subtle, just a light border, near-transparent background, and white text at low opacity. These are placeholder chips — the founder replaces them with real company names. On mobile these wrap to two lines.

Below the social proof strip, after 64px of gap, the hero media block. This is a 16:9 aspect ratio container that holds a product video. The container has a rounded border (20px radius), a very faint white border at 10% opacity, and a strong shadow below (deep, spreading shadow to simulate lift). This is the largest visual element in the hero. It should feel like the product is floating above the dark background. At the very bottom of the container, a gradient fades the video into the near-black background so the section blends seamlessly into Section 2. The video placeholder text reads: `[VIDEO: WorkforceOS product overview — 60–90 second screen recording of the full product]`. The container is full-width of the content column on desktop, full-width minus 24px each side on mobile.

**What this section must accomplish:** Within 3 seconds of landing here, the visitor must know: (1) what the product does, (2) who it's for, and (3) what to do next. The dark background, large white headline, and prominent blue CTA button ensure this even before the user reads a word.

---

### Section 2 — Problem Statement

**Background:** Off-white (`#F8F9FC`). The transition from near-black hero to off-white is abrupt — this is intentional. It signals a shift from "attention-getting" to "let's talk business."

**Layout:** Content column max-width 900px, horizontally centered. 96px top and bottom padding on desktop.

**Top of section:**

Eyebrow label in the same pill format as the hero — blue tint background, sky accent text, all-caps 13px. Text: `PAIN POINTS WE ELIMINATE`.

Below it, the section headline in Plus Jakarta Sans 700, near-black, clamp size between 1.75rem and 2.5rem, tight line-height. Text: **"HR teams drowning in spreadsheets and WhatsApp groups deserve better."** This should feel slightly provocative — it names a specific, embarrassing truth about how Indian SMBs operate. It is left-aligned on desktop, centered on mobile.

Below the headline, a short subheadline in Inter 400, muted slate, 1rem: "These are the six things WorkforceOS was built to replace." This is left-aligned on desktop.

**The pain point grid:**

Six cards arranged in a 3-column grid on desktop, 2-column on tablet, 1-column on mobile. The grid has 24px gaps between cards.

Each card is white, with a light border, 12px border radius, and a soft shadow. Padding inside is 28px on all sides. There is no hover animation on these cards — they are information, not interactive.

At the top of each card is a small icon container: a 40×40px circle with a very light red/orange background tint, containing a simple warning or × icon in red. This colour is intentional — it signals "problem." Below the icon, 16px gap, then the card title in Plus Jakarta Sans 600, 17px, near-black. Below the title, 8px gap, then the body in Inter 400, 15px, muted slate, line-height 1.65.

The six problems, in reading order left-to-right:

Card 1 — **Attendance in Excel.** Body: "Tracking who's in, who's late, and who's on leave across sheets that nobody fully trusts — updated manually every morning."

Card 2 — **Tasks lost in chat.** Body: "No one knows the real status of work. Managers chase individuals. Deadlines slip quietly and accountability disappears."

Card 3 — **Leave requests on WhatsApp.** Body: "Approvals by message, balances tracked manually, and every month HR corrects the same errors in the same cells."

Card 4 — **Payroll is a month-end fire drill.** Body: "LOP calculations, bonus adjustments, and statutory deductions assembled under pressure, from multiple sources, every single cycle."

Card 5 — **Performance is guesswork.** Body: "Annual reviews based on memory and instinct. No data, no trail, no consistent method — and no one trusts the scores."

Card 6 — **Nothing is auditable.** Body: "When something goes wrong — a missed approval, a disputed payout, an unauthorised change — there is no log to check."

**What this section must accomplish:** Make the HR manager or founder reading this feel seen. They have lived at least three of these six problems. The goal is the moment of recognition — "yes, this is exactly us." That recognition is what makes them keep reading.

---

### Section 3 — Solution Overview

**Background:** Near-black (`#0F1117`). Second dark section. The contrast shift from off-white to dark again signals a change of register — we move from "here's your problem" to "here's the answer."

**Layout:** Content column max-width 1100px, horizontally centered. 96px vertical padding.

**Top of section:**

Eyebrow pill in sky-accent colour on dark tint background. Text: `THE WORKFORCEOS DIFFERENCE`.

Headline in Plus Jakarta Sans 700, white: **"Everything HR needs. Nothing it doesn't."** Centered, clamp size between 1.75rem and 2.75rem.

**Three-column value stat row:**

Three columns side by side on desktop, stacked on mobile. 40px gap between columns on desktop. Each column is left-aligned on desktop, centered on mobile.

Each column has: a large number in Plus Jakarta Sans 800, approximately 3.5rem, in sky accent colour. Below it, a label in Inter 500, 13px, white at 50% opacity, uppercase, tracked. Below that, a short body sentence in Inter 400, 15px, white at 65% opacity, line-height 1.6.

Column 1: Number `11`, label `integrated modules`, body: "From onboarding to payroll — all connected, all sharing the same data."

Column 2: Number `0`, label `spreadsheets needed`, body: "Real-time data replaces manual tracking. One platform is always the source of truth."

Column 3: Number `100%`, label `audit-ready`, body: "Every approval, every change, every login — logged automatically with actor and timestamp."

After the three columns, a 1px horizontal line in white at 10% opacity, then 40px of space below.

**Module chip strip:**

A horizontal row of eleven small chips, wrapping freely if needed, justified to the center. Each chip is a pill shape — rounded corners, near-transparent white background, very faint white border, white text at 80% opacity, 14px, Inter 500. The chips are: Employees, Attendance, Leave, Tasks, Performance, Payroll, Expenses, Assets, Knowledge Base, Notifications, Audit Log.

On hover, each chip shifts to a sky-accent border, sky-accent text, and a very faint sky-accent tint background. They are clickable — each one navigates to the corresponding module section on the Features page.

Below the chip strip, 48px of space, then a single centered CTA: a brand blue "Request a demo" button and underneath it in very small text (13px, white at 45% opacity): "30-minute demo · no commitment required". The small text underneath a CTA button is a conversion best practice — it removes a micro-objection.

**What this section must accomplish:** Reframe the pain from Section 2 as solved. The number `11` signals completeness. The number `0` signals simplicity. `100%` signals compliance confidence. After this section the visitor should be thinking "this might actually cover everything we need."

---

### Section 4 — Module Showcase (Role-Based Tabs)

**Background:** Off-white. Returns to light after the dark solution section.

**Layout:** Max-width 1100px, centered. 96px vertical padding.

**Top:**

Eyebrow: `HOW IT WORKS`. Section headline: **"Built for every person on the team."** Left-aligned on desktop. Subheadline below in muted slate: "Different roles see different things. Everyone gets exactly what they need." Left-aligned, Inter 400, 1.0625rem.

**Tab switcher row:**

Five tabs in a horizontal row, left-aligned. The tabs are: HR Manager, Employee, Manager, Finance, Admin. Each tab is a pill-shaped button. Inactive tabs have a transparent background, muted border, and muted grey text. The active tab has a brand-blue background and white text. There is no underline indicator — the filled background is the sole indicator of active state. Switching between tabs instantly swaps the content panel below with a short fade (150ms opacity cross-fade).

The tab row scrolls horizontally on mobile — it does not wrap to two lines. The active tab should always be visible without scrolling when first rendered.

**Tab content panels:**

Each panel is a two-column layout. One column holds a screenshot placeholder (aspect ratio 16:9, rounded frame with light shadow), the other holds a short feature list for that role. The screenshot and the feature list are vertically centered relative to each other.

On desktop, the panels alternate which side holds the screenshot. HR Manager tab: screenshot on the right, feature list on the left. Employee tab: screenshot on the left, feature list on the right. Manager: right. Finance: left. Admin: right. This alternation creates visual rhythm so the section doesn't feel like a static grid.

The feature list in each panel: a short bold title above ("What HR managers can do" / "What employees can do" etc.), then five to eight bullet points. Each bullet is a checkmark in brand blue followed by Inter 400 text, 16px, near-black, line-height 1.65. The checkmarks should be slightly larger than the text (approximately 18px) and sit at the top of the line when text wraps.

Feature list content per tab:

**HR Manager:** One-click employee onboarding with bank details, emergency contacts, and documents captured in a guided wizard. Two-stage leave approval — manager first, HR sign-off second. Org-wide attendance view with late-arrival and no-checkout alerts. Performance reviews powered by a data-driven composite score. Leave policy management per leave type and department.

**Employee:** Check in and out with one tap, for WFH or office. Apply for leave, track balance, see both stages of approval in real time. Accept tasks assigned to you, submit for review, track your own performance score over time. View your monthly payslip and any expense claims you've submitted.

**Manager:** See your team's attendance for today at a glance, with late arrivals highlighted. Assign tasks with due dates and priority levels to any member of your team. Review submitted work and score quality — that score feeds directly into the team member's performance. Approve or reject leave requests from your direct reports with a single action.

**Finance:** Generate monthly payroll runs in one click with auto-calculated LOP from real attendance data. PF, ESIC, Professional Tax, and TDS fields are structured, not manual. Approve expense claims submitted by any employee with a full receipt trail. Export payslips as PDFs.

**Admin:** Define departments, teams, and reporting lines in a visual structure. Assign custom roles with granular permissions — choose exactly what each role can see and do per module. View the full audit log across the entire organisation, every action attributed to an actor.

Screenshot placeholder labels: `[SCREENSHOT: HR dashboard — employee list, leave calendar, attendance heatmap]`, `[SCREENSHOT: Employee view — check-in widget, task list, leave balance card]`, `[SCREENSHOT: Manager view — team attendance grid, task board]`, `[SCREENSHOT: Payroll run — employee salary breakdown, approve button]`, `[SCREENSHOT: Admin panel — role permissions matrix, department tree]`.

On mobile: tabs scroll horizontally. Each tab panel stacks — screenshot first (full-width), then the feature list below. No side-by-side.

**What this section must accomplish:** Every type of person who might be evaluating this product — the HR manager, the employee who will use it daily, the finance head — sees a view that speaks directly to their experience. It answers "but what does it look like for me?" without requiring a full demo.

---

### Section 5 — Feature Cards Grid

**Background:** Off-white, continuing from Section 4.

**Layout:** Max-width 1140px, centered. 64px top padding (reduced from 96px because Section 4 already has bottom padding — the two sections should feel continuous), 96px bottom padding.

**Top:**

Eyebrow: `WHAT'S INCLUDED`. Section headline: **"11 modules. Every one production-ready."** Left-aligned on desktop.

**The grid:**

Three columns on desktop, two on tablet (640px+), one on mobile. 24px gaps. Eleven cards total.

Each card is white with a light border, 20px border radius, 32px interior padding, light shadow. On hover the card lifts slightly (translate up 2px) and the shadow deepens. This is the only hover animation on this page besides button states — it communicates that the cards are navigable without being distracting.

Card anatomy (top to bottom inside the card):

An icon container: 48×48px circle with a colour-coded tint background (each module gets its own colour — blue for Employees, teal for Attendance, sky for Leave, violet for Tasks, amber for Performance, green for Payroll, orange for Expenses, slate for Assets, indigo for Knowledge Base, red for Notifications, dark slate for Audit Log). Inside the circle, a simple 24×24px SVG icon for that module category. The icon and circle are at the top-left of the card, not centered.

Below the icon, 16px gap. Card title in Plus Jakarta Sans 600, 18px, near-black.

Below the title, 8px gap. Card body in Inter 400, 15px, muted slate, line-height 1.65. Two to three sentences. Specific and technical — not marketing fluff.

Below the body, auto space pushing the following elements to the card bottom. A thin 1px border line in the border colour. Below the line, a small stat or capability callout in JetBrains Mono, 13px, brand blue — just one concrete data point. Then a "Learn more →" link in brand blue, Inter 500, 14px, no underline at rest, underline on hover.

Module card bodies and stats:

**Employees** — "Full employee lifecycle from onboarding to exit. A guided 7-step wizard captures personal info, role assignment, compensation, bank details, emergency contacts, and documents in a single transaction." Stat: `7-step onboarding wizard`

**Attendance** — "Check-in and check-out with WFH and WFO modes. Shift-aware late detection, multiple break sessions per day, and attendance adjustment with a mandatory two-person approval rule." Stat: `Nightly absent auto-mark via cron`

**Leave** — "Two-stage approval — direct manager first, then HR. Tracks Casual, Sick, Earned, WFH, and Half-Day leave types. Calendar view of who is out. Auto-deducts balance on final HR approval." Stat: `5 leave types, org-configurable`

**Tasks** — "Scoped task creation — personal, team, department, or org-wide. A clean ten-state lifecycle from draft to closed. Peer review and quality scoring built into the workflow, feeding the performance module." Stat: `10-state lifecycle, no dead ends`

**Performance** — "Composite score from task completion rate, deadline adherence, quality and rework, attendance, and HR qualitative feedback — all weighted, all transparent. No more appraisal guesswork." Stat: `5-factor weighted formula, 0–100 score`

**Payroll** — "Monthly payroll runs with LOP auto-calculated from attendance records. Structured salary bands, PF and ESIC fields, Professional Tax and TDS. Payslip export as PDF." Stat: `LOP derived from actual attendance`

**Expenses** — "Employees draft and submit expense claims with receipt uploads. Manager approves at stage one, Finance at stage two, then marks as paid. Full trail at every stage." Stat: `3-stage approval with receipt trail`

**Assets** — "Track laptops, access cards, phones, and equipment. Assign to employees and log returns with timestamps. See exactly what each person holds right now." Stat: `Full assignment history per asset`

**Knowledge Base** — "Write and publish internal guides, SOPs, and policy documents. Version history keeps a full edit trail. Authors and publish dates always visible." Stat: `Version-controlled, author-attributed`

**Notifications** — "Every meaningful event — task assigned, leave approved, payroll generated — triggers a real-time in-app notification to the right person. Role-targeted and never spammy." Stat: `Real-time, role-scoped delivery`

**Audit Log** — "Every create, update, delete, approval, and login logged with actor, timestamp, before-and-after values, and IP address. Immutable. Compliance-ready from day one." Stat: `Immutable, org-wide, always on`

Below the grid, centred: a line of muted slate text — "Want the full breakdown of each module?" — and a brand-blue "Explore all features →" link that navigates to features.html.

---

### Section 6 — Technical Credibility

**Background:** White card sitting on off-white page. The section's visual is a large, single rounded rectangle — think of it as one big content card, not a section with cards inside.

**Layout:** The outer container is the off-white page at 96px padding. Inside, one white card at max-width 1000px, centered, with a border, 32px border radius, and a medium shadow. Inside the card: two columns, each 50% wide, with 64px interior padding and a 48px gap between columns. On mobile the two columns stack and padding reduces to 32px.

**Left column:**

Eyebrow in the standard pill format: `BUILT TO LAST`. Section headline in Plus Jakarta Sans 700, approximately 1.625rem, near-black, tight line-height: **"Enterprise-grade infrastructure. Startup-friendly setup."**

Body paragraph in Inter 400, 16px, muted slate, line-height 1.7: "WorkforceOS is built on Node.js, PostgreSQL, Prisma, and Next.js — the same stack powering companies like Vercel and Linear. Role-based access control, a full audit trail, and field-level encryption on sensitive data (bank account numbers, PAN) are built in from day one, not bolted on later."

Below the body, a row of four small technology chips. These are very minimal — just a light border, white background, muted grey text, and 5px × 5px dot in the technology's brand colour on the left side. Technologies: Node.js (green dot), PostgreSQL (blue dot), Next.js (black dot), Redis (red dot). These chips are informational, not interactive.

**Right column:**

No headline. Just a vertical list of eight capability statements. Each item has a checkmark icon in success green on the left, then Inter 400 text, 15px, near-black. The checkmark and the first line of text are vertically aligned. When text wraps, the indent aligns with the text start, not the checkmark. 16px between each item.

The eight statements:
- Multi-tenant, org-isolated data — your data is never shared across organisations
- Granular role and permission system — not just "admin" and "employee"
- Bank account numbers and PAN details encrypted at rest
- Rate-limited APIs — no brute-force or scraping exposure
- Every row change in the database logged with before and after values
- Soft-delete on all records — nothing is permanently lost
- JWT authentication with refresh token rotation for session security
- Designed for Indian statutory compliance: PF, ESIC, Professional Tax, TDS

**What this section must accomplish:** Remove a specific objection that technical buyers and security-conscious founders will have: "Is this thing actually safe?" The combination of named technologies, encryption callouts, and compliance awareness earns credibility without a wall of buzzwords.

---

### Section 7 — Testimonials

**Background:** Off-white.

**Layout:** Max-width 1000px, centered. 96px vertical padding. Three cards in a row on desktop, stacked on mobile.

**Top:**

Eyebrow: `WHAT EARLY USERS SAY`. Headline: **"Replacing spreadsheets has never felt this good."** Center-aligned on desktop for this section only — the quotes format feels more natural with centered headers.

**Three testimonial cards:**

Each card is white, bordered, 20px border radius, 32px padding. No shadow — the border is sufficient. Inside each card:

At the very top, a large opening quotation mark in brand blue, Plus Jakarta Sans 700, approximately 3rem, line-height 1. This is a typographic element, not a graphic — just the `"` character in a large size.

Below it, 8px gap, the quote text in Inter 400, 16px, near-black, italic, line-height 1.7. The quote itself should be honest, specific, and about a real outcome — not generic praise.

Below the quote, a 1px border in the border colour, then 20px of space. Then a row: a 40px circle avatar (initials-based, with a colour background based on the person's name initial — these are not photos, just coloured initials circles), then to the right: the person's name in Plus Jakarta Sans 600, 15px, near-black, and below their name, their title and company in Inter 400, 14px, muted slate.

Placeholder quotes:
- "We onboarded 40 employees in the first week. Leave tracking alone saved our HR team three hours every Friday morning." — [Name], HR Manager at [Company]
- "I can see exactly who is working on what, and managers can no longer claim they didn't assign something — it's right there." — [Name], COO at [Company]
- "The payroll run used to take us two full days. With WorkforceOS it's a 20-minute review and an approval click." — [Name], Finance Head at [Company]

The founder replaces these with real testimonials before launch.

---

### Section 8 — Contact / Demo Request Form

**Background:** Near-black. This is the third and final dark section. The shift to dark here signals importance and asks the visitor to stop and act.

**Layout:** Max-width 1000px, centered. 96px vertical padding. Two columns on desktop — left column 42%, right column 58%. 64px horizontal gap between columns. On mobile they stack — left column content above, form below.

**Left column — the persuasion side:**

Eyebrow in sky-accent text on dark tint background: `GET A LIVE DEMO`.

Headline in Plus Jakarta Sans 700, white, clamp between 1.75rem and 2.25rem, tight line-height: **"See WorkforceOS running your way — in under 30 minutes."**

Body text in Inter 400, white at 65% opacity, 1rem, line-height 1.7: "We'll set up a private demo configured with your org's structure, roles, and sample data. No slide deck. No sales script. Just the product working the way your team would actually use it."

Below the body, 32px gap, then a four-item expectation list. Each item begins with an arrow (→) in sky accent colour, followed by white text in Inter 500, 15px. Items: "A 30-minute screen-share demo", "Your questions answered live", "No commitment required", "We reply within 24 hours". 14px between each item.

After the list, at the very bottom of the left column, a very small note in white at 35% opacity, 13px, Inter 400: The founder's direct email address. Just the address, no label. This is a trust signal — it says "there is a real human on the other side."

**Right column — the form:**

The form sits in a slightly lighter container: a card with white at 4% opacity background, a border in white at 10% opacity, 24px border radius, 40px interior padding on all sides.

Form fields from top to bottom:

First and last name on the same row — each taking 50% of the width minus an 8px gap between them. On mobile these stack to full-width.

Work email, full-width.

Company name, full-width.

Company size as a dropdown select. Options: 1–20 employees, 21–50 employees, 51–200 employees, 201–500 employees, 500+ employees. This field helps the founder prepare for the right demo context.

A textarea labelled "What's your biggest HR challenge right now?" with 4 visible rows. Placeholder text: "e.g. We track attendance in Excel and leave approvals come on WhatsApp — it breaks down every month-end." This placeholder is long and specific because it models the kind of honest answer that's useful. It also creates another moment of resonance — the visitor reads it and thinks "yes, that's exactly us."

The submit button is below the textarea, full-width, tall (approximately 54px), brand blue, white text, fully rounded. Label: "Request a demo". No icons, no arrows on the button — the label does all the work.

Beneath the submit button, a single line of text centred under the button: "No credit card · No commitment · Replies within 24 hours" — Inter 400, 13px, white at 40% opacity. This is the final objection removal before they click.

**All inputs on this form** have: a white-at-6% background, a white-at-15% border, white text, white-at-35% placeholder text. On focus, the border shifts to sky accent colour and a faint sky glow appears. Labels are always above the input, always visible, never floating-label style.

**Form submission behaviour:** Submitting the form triggers an email to the founder using EmailJS or Formspree (founder configures this with their credentials). While submitting, the button shows a spinner and its text changes to "Sending…". On success, the entire form area is replaced by a success state: a large green checkmark SVG (48px), "We've got your request." in Plus Jakarta Sans 700 white, then "Expect a reply within 24 hours. We've sent a quick confirmation to your email." in Inter 400 white at 65% opacity. Below this, a small link: "Browse the full module breakdown →" that goes to features.html.

On error, the button returns to its default state and a red error message appears above it: "Something went wrong — please email us directly at [founder email]."

Client-side validation must happen before submission. Required fields: first name, last name, email, company name, company size. The textarea is encouraged but not required. On submission attempt with errors, each invalid field gets a red border and a one-line error message below it in red, 13px. The submit button does not show a spinner if validation fails.

**What this section must accomplish:** Convert intent into action. By this point in the page the visitor who is still reading is a qualified lead. The form asks for just enough — 5 required fields — to be useful without being friction. The expectation list on the left removes the fear of a hard sales pitch. The 24-hour reply promise removes the fear of being ignored.

---

## Page: features.html

This page serves visitors who clicked "See all modules" from the hero or any module chip from Section 3. They are past the awareness stage — they want specifics.

### Page Hero

**Background:** Off-white. This page does not open dark — it is a reference document, not a landing page.

**Layout:** Centered column, max-width 760px, 140px top padding (clears fixed nav), 80px bottom padding.

**Content:** Eyebrow: `PRODUCT MODULES`. Headline in Plus Jakarta Sans 700, clamp 2rem to 3rem: **"Every feature, documented."** Subheadline in Inter 400, muted slate, 1.125rem: "11 modules. Built for Indian companies. Designed for every role in your organisation." Below the subheadline, a centered "Request a demo" button — brand blue — because the conversion goal exists on every page.

### Page Body Layout

On desktop: a two-column layout. The left column is 200px wide and sticky — it stays fixed relative to the viewport as the user scrolls through the content. The right column is the main content area taking the remaining width minus a 48px gap.

The sticky left sidebar contains the list of all 11 module names as navigation links. At rest, links are muted slate, Inter 500, 15px. The currently-visible module (detected by IntersectionObserver) gets a brand-blue left border (3px) and brand-blue text. Hovering any link shows the blue border transition in. Clicking scrolls smoothly to that module section.

On mobile: the sticky sidebar collapses into the same horizontal scrollable pill strip from Section 3 of the homepage — same styling, positioned just below the hero at the top of the content area. It stays at the top of the scroll container (sticky, below the nav).

### Each Module Section

Eleven sections in the right column, one per module, each with an anchor ID matching its module name (e.g., `id="attendance"`). A 1px border in the border colour separates each module section.

Every module section follows this exact internal structure:

**Module header row:** The colour-coded icon circle (48px, same colour coding as the homepage cards) followed by the module name in Plus Jakarta Sans 700, 22px, near-black. These are on the same horizontal line, icon vertically centred with the text. 48px top padding above this row for each module.

**Screenshot placeholder:** Full-width of the right column, aspect ratio 16:9, with the placeholder label inside it. The placeholder frame has a dashed border, light rounded corners, and a light background tint. Label format: `[SCREENSHOT: module-name — describe what's visible in the screenshot]`. When the founder adds a real screenshot, this frame becomes a clean image with rounded corners and a light shadow.

**Feature list:** Below the screenshot, 32px gap. A list of six to eight features. Each feature is a sub-row with: a bold title in Plus Jakarta Sans 600, 16px, near-black, and below it one sentence of description in Inter 400, 15px, muted slate. 24px between each feature item. There are no bullet points or checkmarks here — the bold title is the visual separator.

**Bottom CTA:** Below the last feature item, 32px gap, then a line in muted slate Inter 400, 15px: "Want to see [Module Name] in action?" followed immediately by a link in brand blue: "Request a demo →".

**Mobile:** The sticky sidebar becomes the horizontal pill strip. The two-column layout collapses to one column. Screenshots are full-width. The internal module structure is identical, just narrower.

---

## Page: about.html

### Purpose

Give the product a human face. Indian B2B decisions are relationship-driven — the buyer wants to know who built this and whether they can trust them. This page is short and personal.

### Hero Section

**Background:** Off-white. Generous top padding of 140px. Max-width 760px, centered.

Eyebrow: `OUR STORY`. Headline in Plus Jakarta Sans 700: **"Built by someone who's seen the spreadsheet chaos firsthand."**

**Two-column layout within this section:** On desktop, the founder's photo is a 280×280px circle on the right side of the headline area. The headline and body text flow in the left 60%. On mobile, the photo sits centered above the text, sized to 200×200px.

The photo placeholder: `[FOUNDER PHOTO — professional headshot, 280×280 minimum]`. The circle has a 3px brand-blue border and a light shadow.

Below the headline on the left, the body section is for the founder's personal story. Placeholder: `[FOUNDER STORY — 3–4 paragraphs. Write in first person. Explain what you were doing before, what problem you personally encountered, what made you build WorkforceOS instead of buying something else, and who this is specifically designed for. Be honest about the stage the product is at. Avoid corporate language.]`

Inter 400, 1rem, near-black or muted slate, line-height 1.75.

### Values Section

Three cards in a row on desktop, stacked on mobile. Off-white background, white cards, light border, 12px radius, 32px padding.

Each card: a 48px icon at the top (SVG, colour-coded), then a title in Plus Jakarta Sans 600, 18px, then a body in Inter 400, 15px, muted slate, line-height 1.65, approximately 50 words.

Card 1 — **Transparency** — "Every action in WorkforceOS is logged and attributable. We built the audit trail first, then built the features around it. We run our own product the same way."

Card 2 — **Simplicity** — "Most HRMS platforms ship with 200 features and 180 you never use. WorkforceOS ships with the 11 things Indian companies actually need, and lets you disable the rest."

Card 3 — **Indian-first** — "PF, ESIC, Professional Tax, TDS — not afterthoughts. The leave types, the reporting hierarchies, the payroll structures — all designed for how Indian companies actually operate."

### CTA Section

Near-black background. Single centred column, max-width 560px. Eyebrow: `READY?`. Headline in Plus Jakarta Sans 700, white: **"See what WorkforceOS can do for your team."** Below it, a brand-blue "Request a demo" button and the "30 minutes · no commitment" small text beneath it.

---

## Page: contact.html

### Purpose

A dedicated contact page for visitors who navigate here from the footer or directly. It carries the same form as Section 8 of the homepage but in a more spacious, focused context.

### Layout

Split-screen, full viewport height minimum. The page is divided vertically into two panels. On mobile, the two panels stack — the left panel becomes a compact dark strip at the top, the right panel takes the full remaining height.

### Left Panel (40% width, near-black background)

Vertically centred content within the panel. Everything is centre-aligned within the panel.

At the top of the centred content block: the WorkforceOS logotype in white.

Below it, 48px gap. Eyebrow: `LET'S TALK` in sky accent. Headline in Plus Jakarta Sans 700, white, approximately 1.75rem: **"See WorkforceOS working for your business."**

Below the headline, 32px gap. A three-step visual list:

Step 1 — number `1` in sky accent, then "Fill in the form" in white Inter 600 16px, then below it "We'll read it today" in white at 55% opacity Inter 400 14px.

16px gap between steps.

Step 2 — `2`, "We reply", "Within 24 hours".

Step 3 — `3`, "Live demo", "30 minutes, no slide decks".

The step numbers sit in a 32px circle with a sky-accent-at-15% background.

At the bottom of the left panel, fixed to the panel bottom, the founder's email address and LinkedIn profile link in white at 45% opacity, Inter 400, 14px. These are hyperlinks that open mail client and LinkedIn respectively.

### Right Panel (60% width, off-white background)

The form sits centred within the panel, max-width 480px, with 48px vertical padding. The form fields, labels, and validation styling match Section 8 of the homepage exactly but use the light form styling: white input backgrounds, light borders in the border colour, near-black label text, brand blue focus glow.

Form fields and layout: identical to the homepage form — first name + last name on one row, work email, company name, company size select, challenge textarea, submit button, micro-text beneath button.

Headline above the form: "Tell us about your team" in Plus Jakarta Sans 600, 20px, near-black. Sub-label in muted slate 14px: "We read every submission personally."

---

## Page: privacy.html and terms.html

Both pages share a layout. Max-width 720px, single column, off-white background, Inter typography throughout, generous line-height (1.75). Generous top padding (140px) to clear the nav.

Page headline in Plus Jakarta Sans 700, 2rem, near-black. Date line below it: "Last updated: [Date]" in muted slate, 14px.

Section headings within the document in Inter 600, 18px, near-black, with 40px of space above each one.

Body paragraphs in Inter 400, 16px, near-black, line-height 1.75.

The content itself should be practical and honest — not a wall of legal boilerplate. Privacy: what data is collected, what it's used for, who it's shared with (nobody), how long it's retained, how to request deletion. Terms: what the service is, acceptable use, the founder's liability limits. Founder reviews with a lawyer before publishing.

---

## Mobile Behaviour — Rules That Apply Everywhere

These rules are not optional and apply to every section of every page without exception.

**Minimum touch target:** Every tappable element — buttons, links, form inputs, tab chips, nav links — must be at least 44×44px in tap area. If the visual element is smaller, the tap area is expanded invisibly using padding.

**Input font size:** Every form input uses a minimum font size of 16px. This prevents iOS Safari from auto-zooming into the input on focus, which breaks the layout.

**Autocomplete attributes:** All form inputs carry the correct HTML autocomplete attribute. First name: `given-name`. Last name: `family-name`. Email: `email`. Company: `organization`. This enables browser and password manager autofill, reducing friction.

**Horizontal overflow:** The body has `overflow-x: hidden`. No element may cause horizontal scrolling. The tab strips and chip rows use `overflow-x: auto` with the scrollbar hidden, not wrapping to two lines.

**Images:** All images have explicit width and height attributes. All images below the fold have `loading="lazy"`. All hero images and videos are loaded eagerly and preloaded. Images use modern formats (WebP) with a JPEG fallback. srcset provides at least three size variants.

**Section padding:** 48px top and bottom on mobile. 96px on desktop. The switch happens at 1024px viewport width.

**Typography:** All display text uses clamp() for fluid sizing. Body text stays at 1rem (16px) on all screen sizes — it is already the right size for mobile reading.

**Navigation:** On mobile, the hamburger menu closes on: tap of the × close button, tap outside the menu links, and pressing the Escape key. The overlay appears above all other content including fixed elements.

**Form on mobile:** First and last name stack to full-width, one per row. Submit button is full-width. All padding inside the form container reduces to 24px. The form container itself has no shadow on mobile (unnecessary on a single-column layout).

**Animations:** All scroll-reveal and hover animations respect `prefers-reduced-motion: reduce`. When this media query matches, all elements are immediately visible (no hidden-then-revealed state) and all transitions are instant. This is not a feature, it is a requirement.

**Video in hero:** The hero video has `autoplay`, `muted`, `loop`, and `playsinline` attributes. It loads eagerly. It has a poster image (the first frame or a dedicated still) that shows while the video loads, ensuring no blank area. On low-bandwidth connections the video does not load — the poster image takes its place naturally.

---

## Content Placeholder Convention

Every placeholder in the built pages must be visually obvious as a placeholder — a dashed border frame, a light background, and a centred label. The label format is always:

`[TYPE: description of what goes here]`

Types: SCREENSHOT, VIDEO, FOUNDER PHOTO, FOUNDER STORY, TESTIMONIAL, COMPANY NAME, FOUNDER EMAIL, FOUNDER LINKEDIN.

The founder's workflow after receiving the built pages: search the document for `[` and replace each one in order.

---

## EmailJS Configuration

The contact form on both the homepage and contact.html submits via EmailJS. No server is needed. The founder creates an account at emailjs.com, connects their Gmail, creates a template with variables for each form field, and pastes three credentials (public key, service ID, template ID) into the JavaScript file that handles form submission.

The template the founder configures should produce an email in this format:

Subject: `Demo request — [first name] [last name] at [company]`

Body: name, email, company, company size, and their stated challenge. Each on its own line, labelled clearly.

Alternative: Formspree.io provides the same result with a simpler setup — the form action points to a Formspree URL and submission is handled automatically.

The SETUP.md file in the project root lists these steps so the founder can do it without assistance.

---

## What the Agent Must Not Do

Do not add sections that are not listed in this document. Do not add a pricing section. Do not add a FAQ accordion unless the founder explicitly requests it later. Do not add any stock photography or generated illustrations — placeholders only. Do not use gradient text on headlines (it reads as 2022 design trend). Do not add animated particle systems, cursor effects, or ambient video backgrounds — they distract from the copy. Do not add a cookie consent banner unless the founder's legal advisor requires it. Do not add a live chat widget by default.

Do not deviate from the colour tokens, type scale, or spacing system defined at the top of this document. If something is not specified, choose the option with less decoration, not more.

---

*End of instructions. Build each page section in the order listed. After completing each section, verify its mobile layout at 375px and 768px viewport widths before proceeding.*
DOCEOF

No emojies, only icons smooth animations, mac style premium preview illustrations and perfect pagee.....I want like crazy scrolling effects and some out of the box design