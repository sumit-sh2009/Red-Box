# CivicPulse — Presentation Brief for Canva

**Use this document as the single source for slides, copy, feature lists, demo flow, and emotional messaging.**  
Built for hackathon / pitch decks. All product claims below match what the app actually does.

---

## Brand essentials

| Item | Suggested text |
|------|----------------|
| **Product name** | CivicPulse |
| **Category** | Anonymous civic reporting + AI government intelligence |
| **Tagline options** | • *Your city’s pulse, heard — not lost.*<br>• *From street frustration to structured intelligence.*<br>• *Anonymous reports. Visible action.*<br>• *When citizens speak, governments can listen — at scale.* |
| **One-line pitch** | CivicPulse lets citizens file **anonymous** civic issues (potholes, water, garbage, safety) in seconds; AI classifies, clusters, routes, and briefs government teams — so complaints don’t die in the wrong office. |
| **Audience** | Hackathon judges, municipal / e-governance stakeholders, youth civic-tech audiences, India digital public infrastructure narrative |

**Demo logins**

| Role | Username | Password |
|------|----------|----------|
| Citizen | `citizen_demo` | `password123` |
| Government | `gov_demo` | `password123` |

**Live demo URL (local):** landing `http://localhost:5173/` · app `http://localhost:5173/app/` · Government: `/app/#gov-panel`

---

## The story (problem → why we built this)

### The problem (for slides)

- A citizen files a complaint at one counter — it gets **misrouted**, **duplicated**, or **forgotten** between departments.
- People who cannot afford time for repeated visits often **take to the streets** — protests born from silence, not violence.
- Municipal offices receive **thousands of unstructured messages** with no priority, no clustering, no ward-level view.
- **Fear of retaliation** stops honest reporting in sensitive neighborhoods.
- Paper registers and WhatsApp forwards **do not scale** for a nation of 1.4 billion.

### Our answer

CivicPulse turns **raw citizen voice** into **structured civic intelligence**:

1. **File anonymously** — identity never shown on public reports.
2. **AI pipeline** — safety, classification, similarity, clustering, department routing, priority.
3. **Government intelligence panel** — live KPIs, ward analytics, clusters, AI briefing, natural-language Q&A.
4. **Exports** — PDF / CSV / JSON from **real database counts** (no invented statistics).

---

## Emotional & proud lines (ready for Canva text blocks)

Use these as **headlines, pull quotes, or closing lines**. Pick what fits your tone.

### Digital dignity (replacing streets with systems)

- *“We don’t need another protest to prove a pothole exists.”*
- *“The street was never the only place to speak — it was the only place people felt heard.”*
- *“CivicPulse moves frustration from the road to the record.”*
- *“When filing takes 60 seconds, shouting becomes optional — not obligatory.”*
- *“Digital India isn’t only payments and IDs — it’s **everyday problems** reaching the right desk.”*

### Voice that doesn’t vanish

- *“Your complaint shouldn’t need three offices to be remembered.”*
- *“One report. One tracking code. One thread that doesn’t get lost in a drawer.”*
- *“From anonymous citizen to classified intelligence — nothing falls through the gap between departments.”*
- *“The voice of the people should not echo in empty corridors.”*
- *“We built a system where **silence is not the default outcome** of filing a grievance.”*

### Trust & anonymity

- *“Speak without fear. Report without a name on the public feed.”*
- *“Anonymity protects the whistleblower on the street — and the parent outside the school gate.”*
- *“Government sees **issues, wards, and clusters** — not identities.”*

### AI with responsibility

- *“AI that serves democracy: classify, cluster, route — never invent.”*
- *“Every number on the government dashboard comes from filed reports — the model only **narrates truth**.”*
- *“From scattered complaints to **critical signals** — intelligence, not noise.”*

### Pride / India scale

- *“Built for the scale India demands: wards, departments, clusters, and crores of small fixes that make cities livable.”*
- *“This is what **Digital India** looks like at the ward level — potholes, drains, lights, safety.”*
- *“Not a form portal. A **civic intelligence command center** for the people who run our cities.”*
- *“For every child walking past a broken road — a report that can reach PWD before the next monsoon.”*
- *“CivicPulse: because **governance at 1.4 billion** cannot rely on memory alone.”*

### Hackathon / team energy

- *“We didn’t build another CRUD dashboard — we built the bridge between **citizen frustration** and **government action**.”*
- *“Hackathon code with production intent: real API, real pipeline, real exports.”*
- *“From LangGraph nodes to ward charts — every layer tells the same story: **listen, structure, act**.”*

### Short punch lines (for badges / stickers on slides)

- *Report. Anonymously. Trackably.*
- *Clusters beat chaos.*
- *Intelligence, not inbox.*
- *Your ward. Your issue. Your pulse.*
- *File once. Route right.*

---

## Slide-by-slide outline (suggested Canva deck)

| # | Slide title | What to show / say |
|---|-------------|-------------------|
| 1 | **CivicPulse** | Logo + tagline + India civic imagery (roads, drains, community — not stock “hacker” neon) |
| 2 | **The silent crisis** | Citizen at broken road / flooded lane → complaint lost between offices → optional protest visual |
| 3 | **What if voice traveled?** | Simple flow: Citizen → Report → AI → Government → Action |
| 4 | **For citizens** | Anonymous filing, photo evidence, categories, support, tracking |
| 5 | **For government** | Intelligence panel screenshot: KPIs, charts, briefing |
| 6 | **AI pipeline** | 9 steps: validate → safety → classify → similar → cluster → RAG → route → priority → evaluate |
| 7 | **Clusters** | Two similar reports → one cluster → higher priority |
| 8 | **Grounded briefing** | AI executive summary + critical signals + recommended actions |
| 9 | **Ask the intelligence layer** | Natural-language Q&A over live data |
| 10 | **Exports & accountability** | PDF / CSV / JSON — audit-ready reports |
| 11 | **Tech stack** | React, Express, LangGraph, Groq LLM, RAG, Recharts |
| 12 | **Built for India** | Wards, departments, taxonomy aligned to municipal reality |
| 13 | **Impact vision** | Less street protest, more structured resolution; scalable to every ULB |
| 14 | **Live demo** | citizen_demo → file report → gov_demo → intelligence |
| 15 | **Thank you / Q&A** | Team names, repo, emotional closing line |

---

## Complete feature list

### Citizen experience

| Feature | Description |
|---------|-------------|
| **Anonymous public reports** | Display name is always *“Anonymous citizen”* — `author_id` never exposed on public APIs |
| **Rich issue filing** | Description, location (required), optional category, optional photo evidence |
| **Issue categories** | Roads & Infrastructure, Water Supply & Drainage, Sanitation & Waste, Street Lighting & Power, Public Safety & Hazards, Parks & Public Amenities, Education & Community, Transport, Noise, Construction, Other |
| **Live AI pipeline on submit** | Visible stages while processing: validate, safety, classify, cluster, route, etc. |
| **Pre-submit moderation** | Safety check before accept; revise flow for unclear reports; reject for abuse/spam |
| **Public feed** | Browse civic reports like a civic social feed (threads, hashtags, search) |
| **Support / amplify** | Citizens can support reports to show community urgency |
| **Tracking codes** | Each complaint has a tracking code for follow-up |
| **Revise UX** | If AI needs clarity, citizen gets actionable revise message (not silent failure) |
| **Responsive UI** | Mobile-friendly filing and browsing |

### Government intelligence panel

| Feature | Description |
|---------|-------------|
| **Operations snapshot (KPIs)** | Open queue, In progress, Resolved, Closed — live counts, filterable |
| **Intelligence hero band** | CitySignal motif: Citizens → Reports → AI → Signals → Action |
| **AI intelligence briefing** | Situation overview (LLM/heuristic), critical signals, recommended actions |
| **Department ranking** | Backlog and resolution performance by department |
| **Analytics charts** | Filing trends (30-day), category mix (pie + bar), status-by-category stacked bars |
| **Ward analytics** | Ward-level volume chart; click ward to filter queue |
| **Issue clusters** | Repeated / similar reports grouped with size, support, department, priority score |
| **Priority queue / reports table** | Search, ward filter, priority filter, sort; desktop table + mobile cards |
| **Report actions** | Assign (in progress), Close (rejected), Resolve, full detail modal with timeline |
| **Status timeline** | Audit trail of status changes with actor and notes |
| **High-priority alerts** | Banner when urgent pending reports need inspection |
| **Ask the intelligence layer** | Natural-language questions answered from live civic tools (overview, departments, clusters) |
| **Live sync indicator** | Last refreshed timestamp; stepped loading per API during refresh |
| **Exports** | **CSV** (complaints, clusters, departments, summary), **PDF** intelligence report, **JSON** full report |
| **Privacy enforcement** | Panel shows clusters, wards, departments — **not citizen identities** |

### AI & intelligence layer

| Feature | Description |
|---------|-------------|
| **LangGraph workflow** | Stateful pipeline: validate → safety → classify_extract → retrieve_similar → cluster → rag_departments → route_department → priority → evaluate |
| **Safety moderation** | Groq safeguard model + heuristics; blocks threats/spam; allows angry civic criticism |
| **Classification** | Category, severity, urgency, summary, entities, recommended action |
| **Similarity & clustering** | Embeddings find related reports; clusters surface repeat infrastructure failures |
| **RAG department routing** | Knowledge base (`departments.md`) + taxonomy → route to PWD, Water, Sanitation, Power, etc. |
| **Priority scoring** | Government priority from urgency, cluster size, support count |
| **Human-in-the-loop** | `needs_review` for low-confidence cases; officers can override via PATCH |
| **Grounded briefing** | `GET /api/gov/briefing` — narrative tied to real totals; `used_llm` flag when LLM used |
| **Gov Ask agent** | `POST /api/gov/ask` — Q&A over civic tools; no invented numbers |
| **LLM fallback chain** | Groq → Ollama → OpenRouter → labeled heuristic |
| **Embedding fallback** | Ollama `nomic-embed-text` → OpenRouter → local hash embedding |

### Platform & engineering

| Feature | Description |
|---------|-------------|
| **Express public API** | `/api/complaints`, `/api/gov/*` — single backend for demo |
| **Civic data store** | SQL-shaped JSON (`server/data/civic.json`); Postgres schema ready |
| **Python AI worker** | FastAPI/LangGraph on `:8001`; Express falls back if worker down |
| **Role-based auth** | Citizen vs government accounts |
| **PDF export** | Multi-page Civic Intelligence Report (KPIs, briefing, charts, clusters, queue) |
| **UX4G-informed design** | Trust-first civic UI; IBM Plex; navy + paper + intelligence accent |
| **Motion & responsiveness** | Staged entrances, reduced-motion support, mobile table → cards |

---

## Issue types citizens can report (use on “What we cover” slide)

- Potholes & damaged roads  
- Waterlogging & drainage failures  
- Garbage & sanitation  
- Street lighting & power outages  
- Public safety hazards  
- Parks & public amenities  
- Education / school-adjacent infrastructure  
- Transport & traffic issues  
- Noise & construction violations  

---

## Government departments in routing logic (sample)

- Public Works Department (Roads)  
- Water Supply & Drainage  
- Sanitation & Solid Waste  
- Electricity / Street Lighting  
- Municipal Corporation / General Administration  
- (Plus taxonomy-driven routing via RAG)

---

## Before vs after (comparison slide)

| Before CivicPulse | With CivicPulse |
|-------------------|-----------------|
| Complaint filed at wrong counter | AI routes to correct department |
| Same pothole reported 50 times separately | **Clusters** show one infrastructure failure |
| Officer reads WhatsApp forwards | **Ward chart** + priority queue |
| Citizen identity exposed | **Anonymous** public feed |
| No executive summary | **AI briefing** + critical signals |
| Protest as last resort | **Digital channel** that scales |
| Numbers invented in slides | Exports from **live database** |

---

## Demo script (2–3 minutes for presenter)

1. **Citizen** (`citizen_demo`): Open app → File report: *“Large pothole outside Central School, water pooling when it rains.”* Add location. Submit → watch **live pipeline** chips animate.
2. **Optional:** File a similar report (paraphrase) → explain it will **cluster** with the first.
3. **Government** (`gov_demo`): Open **Intelligence** panel.
4. Show **KPI cards** → click Open queue to filter.
5. Scroll **Intelligence briefing** → point at *Critical signals* and *Recommended actions*.
6. Show **ward chart** → click a ward to filter table.
7. Open **Clusters** → “13 reports, one road — that’s actionable intelligence.”
8. **Ask:** “Which department has the highest backlog?” → grounded answer.
9. Click **PDF report** or **CSV** → “Audit-ready, no fake stats.”
10. Close with emotional line: *“This is how we reduce the need to shout on the street — by making sure the file is heard.”*

---

## Tech stack (credibility slide)

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Motion |
| Backend API | Node.js, Express |
| AI orchestration | Python, LangGraph, FastAPI |
| LLM | Groq (GPT OSS models) + Ollama + OpenRouter fallbacks |
| Embeddings | Ollama / OpenRouter / local heuristic |
| RAG | Department knowledge base markdown chunks |
| PDF | jsPDF |
| Data | JSON civic store (+ Postgres schema for production path) |

**Course / curriculum mapping (if judges care):** Pydantic schemas, StateGraph nodes, structured LLM output, RAG, guardrails, HITL `needs_review`, evaluator node.

---

## Visual suggestions for Canva

- **Color palette:** Deep navy `#0b2545`, warm paper `#f4f1ea`, saffron accent `#c65d12`, intelligence indigo `#4a2bc2` (AI moments only).
- **Typography feel:** Clean sans (IBM Plex style) — serious government trust, not arcade/game UI on gov slides.
- **Icons:** Road, water drop, trash bin, lightbulb, shield, map pin, cluster nodes, AI sparkle (subtle).
- **Avoid:** Cyberpunk neon, fake “hacker” dashboards, generic admin template screenshots.
- **Include:** Screenshot of Intelligence briefing + KPI row + CitySignal flow (export from running app).
- **India context:** Ward map aesthetic, municipal building, school + road imagery, diverse citizens (illustrated, respectful).

---

## Impact narrative (for “Why India needs this” slide)

- **Urban local bodies (ULBs)** manage roads, water, waste, lights — the issues citizens feel **every day**.
- **Right to Service / grievance redressal** movements proved citizens want **timelines and accountability** — CivicPulse is the digital layer.
- **DPDP-conscious design:** anonymity on public surface; internal auth for filing only.
- **Scalable pattern:** Same architecture can plug into state portals, Smart City dashboards, and 311-style systems.
- **Youth engagement:** Low-friction mobile filing for digital-native citizens who won’t visit a municipal office for a pothole.

**Honest scope note for judges:** This is a **hackathon demonstration** with demo data and local JSON store — architecture is designed for Postgres + production SSO integration.

---

## API surface (optional technical appendix slide)

- `POST /api/complaints` — file report  
- `POST /api/complaints/moderate` — pre-check  
- `GET /api/gov/overview` — totals, categories, wards, urgent count  
- `GET /api/gov/clusters` — cluster list  
- `GET /api/gov/briefing` — grounded narrative  
- `POST /api/gov/ask` — intelligence Q&A  
- `GET /api/gov/trends` — daily filing series  
- `GET /api/gov/departments` — department ranks + category status  
- `PATCH /api/gov/complaints/:id` — assign / resolve / close  

---

## Closing lines (pick one for final slide)

1. *“CivicPulse — because every ward deserves to be heard, and every report deserves a path.”*  
2. *“We’re not replacing protest — we’re replacing **helplessness**.”*  
3. *“From anonymous report to government intelligence — built in India, for India’s streets.”*  
4. *“Your voice. Structured. Routed. Remembered.”*  
5. *“Thank you. Let’s build cities where filing works faster than frustration.”*

---

## Team checklist before presenting

- [ ] Run `./start-all.sh` — API `:3001`, AI `:8001`, client `:5173`  
- [ ] Test both demo logins  
- [ ] Pre-file 1–2 reports so gov panel isn’t empty  
- [ ] Export one PDF to show offline artifact  
- [ ] Prepare backup screenshots if Wi‑Fi fails  
- [ ] Rehearse 2-minute demo path above  

---

## File references in repo (for screenshots)

| What | Path |
|------|------|
| Government panel | `client/src/pages/GovernmentPanelPage.tsx` |
| Intelligence briefing UI | `client/src/components/gov/IntelligenceBriefing.tsx` |
| AI pipeline | `ai/graph.py`, `client/src/constants/pipeline.ts` |
| Taxonomy / categories | `config/civic-taxonomy.json` |
| Design tokens | `DESIGN.md`, `client/src/index.css` |
| README / run instructions | `README.md` |

---

*Generated for CivicPulse team presentation. Update demo URLs and team names on the final slide as needed.*
