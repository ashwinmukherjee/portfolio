# CASE STUDY CONTENT SPEC — SOUNDCLOUD STACKS
## Design decisions for translating the Notion export into the portfolio

Reference alongside BRAND_REFERENCE.md.

---

## SOURCE CONTENT

"Every Song Has a Story" — a redesign of SoundCloud's "Behind this track" feature.
Written by Ashwin Mukherjee, Winter 2024.
Exported from Notion as Markdown. Images in img/soundcloudstacks/.

---

## CONTENT DECISIONS

### Emojis
REMOVE all section-header emojis (💡🕵🏼‍♂️🎞️🍿📱🪞). Replace with typographic section markers — could be a number, a subtle bengara accent, or nothing. Let spacing and type weight do the section-identification work.

### Section structure
The case study has 6 major sections:
1. Inspiration — personal context + video references
2. Validation — user research + problem statement
3. Existing Experience — platform analysis
4. Reimagined Experience — brainstorming + sketches
5. Prototypes — the designed solution
6. Reflections — takeaways

### Aside/callout blocks
Three types in the content, each doing different rhetorical work:

- **Problem statement** ("Existing music platforms are polished and hyper-optimized...") — this is the thesis. Give it the most visual prominence. It should feel like a moment of clarity in the narrative. Consider: bengara accent, increased whitespace, a typographic shift.

- **Process summary** ("After my research and brainstorming, I settled on...") — transitional, functional. Should feel like a pause/checkpoint, not a climax. Quieter treatment than the problem statement.

- **Reflections** (the three numbered insights at the end) — conclusive but not loud. Each has a bold title + explanatory paragraph. This is a specific pattern: numbered + titled + explained. Not a list, not a blockquote. Its own treatment. Should feel like considered takeaways, not bullet points.

Finalize relative prominence of these three types during prototyping.

### YouTube / external media references
DO NOT embed YouTube players. Instead, create styled links/references:
- The video title (linked)
- A source line (channel name)
- Possibly a still frame or thumbnail (optional — test with and without)
Keep the visual control with the portfolio's design system, not YouTube's UI.

### Images
~12 images total. Several distinct types:
- **Hand-drawn sketches** (IMG_1683.jpg, IMG_1681.jpg) — photographed paper sketches
- **UI mockups** (polished, dark-background SoundCloud screens)
- **Screenshots** (existing SoundCloud UI, Apple Maps)
- **Animated GIF** (stack-animation.gif — the key demo)

Open to testing differentiated treatment for sketches vs polished mockups (e.g., sketches could have a slightly different framing, a paper-like border, or sit at a different width). But don't overdo it — if it feels like too much, unify them.

### Image captions
Captions are substantive in this case study — they carry real information, not just labels. Examples:
- "SoundCloud's waveforms convert the frequencies of an audio file into a scrollable progress bar."
- "A digital audio workstation (DAW). Modern songs are often complex..."

Treat captions as a real typographic tier: smaller than body, likely in sage or reduced opacity, but readable and respected. Not an afterthought.

Some images have the caption "Click to zoom in" — these get a lightbox interaction instead of a text caption.

### Lightbox / zoom interaction
Images marked for detail viewing open into a full-viewport lightbox on click/tap. The transition should be slow and spatial — the image expands from its position, the background dims to indigo black. Exiting reverses. This is a brand moment: the Aman principle of proportional reward (casual viewer sees it inline, curious viewer enters the detail).

### Blockquotes
Two rhetorical types mixed in the content:
- **Person quotes** ("That'd be absolutely sick" — USC musician; the Reddit user quote) — these are voices. Could benefit from a slightly different treatment that signals "someone said this."
- **Definitions/concepts** (the "stacks" music definition) — these are explanatory. More like an aside than a voice.

Test whether these need distinct treatments or if a single blockquote style handles both.

### Lists
A few short bulleted lists (validation findings, design criteria). Keep them as prose-like as possible — generous line height, no tight bullet packing. They should feel like structured thinking, not a slide deck.

### Body copy rhythm
The content alternates: explain → show → explain → show. Roughly every 2-3 paragraphs there's an image. The design needs to handle this rhythm gracefully — enough breathing room between text and image that it doesn't feel like a blog post with pictures dropped in, but not so much space that the narrative loses momentum.

---

## WHAT THIS SPEC IS NOT

This doesn't prescribe exact CSS values. It describes the rhetorical function of each content type so that typographic and spacing decisions serve the content's intent, not just its structure.
