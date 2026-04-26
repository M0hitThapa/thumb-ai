import { type Part } from "@google/genai"
import type {
  ClassifiedImage,
  GenerateImagesRequest,
  GeneratedVariant,
  ImageCategory,
} from "@/lib/types"
import { getVertexGenAI } from "./vertex-genai"

const IMAGE_MODEL = "gemini-3.1-flash-image-preview"

interface VariationConfig {
  readonly strategy: GeneratedVariant["strategy"]
  readonly direction: string
}

const VARIATION_CONFIGS: readonly VariationConfig[] = [
  {
    strategy: "dramatic",
    direction:
      "DRAMATIC: Maximum emotional impact. Deep contrast lighting, saturated bold colors, cinematic feel. Like a movie poster that makes someone stop scrolling.",
  },
  {
    strategy: "clean",
    direction:
      "CLEAN: Confident and professional. Clear visual hierarchy, strong contrast between subject and background. Modern and authoritative.",
  },
  {
    strategy: "artistic",
    direction:
      "ARTISTIC: Unexpected creative angle. Unconventional perspective, bold graphic treatment, or surprising visual metaphor no other creator would think of.",
  },
] as const


function buildVariantTypographyGuidance(strategy: GeneratedVariant["strategy"]): string {
  const common =
    "Apply this ONLY to the on-image title text (same allowed words). Do NOT default to generic 'white letters + thick black outline + Impact' unless this block explicitly fits that vibe."

  if (strategy === "dramatic") {
    return `
## TYPOGRAPHY & TITLE STYLE — THIS VARIANT: DRAMATIC

${common}

- **High-energy display type** — condensed cinematic sans, ultra-bold wedge/gothic, or trailer-style caps with attitude. NOT the same font personality as a generic gaming thumbnail every time.
- **Color & materials** — Try: hot yellow + deep red, electric cyan + magenta rim, chrome/metallic gradient fills, neon outer glow, or fire/ice split on key words. Use 2–3 colors inside the letters that echo the scene lighting.
- **Effects** — Layered glow, subtle 3D extrusion, inner shadow, or sharp double-outline (inner light + outer dark). Avoid flat plain white fills unless the scene is very dark and it is the only readable choice.
- **Hierarchy** — You may make ONE important word from the title clearly larger or more luminous than the rest (still only words from the title).
- **Casing** — ALL CAPS or sharp Title Case; pick whichever feels more cinematic for this title.
`.trim()
  }

  if (strategy === "clean") {
    return `
## TYPOGRAPHY & TITLE STYLE — THIS VARIANT: CLEAN / PREMIUM

${common}

- **Refined sans or neo-grotesk** — modern geometric, editorial magazine, or Apple-keynote calm. Crisp curves, confident spacing — a different typographic personality than "dramatic" or "artistic" variants.
- **Color** — Prefer text color pulled from the thumbnail's palette (e.g. cream on navy, soft black on sand, deep brand green on off-white). White-only text is allowed but should feel intentional, not default.
- **Separation from background** — Use a tight soft plate, very subtle drop shadow, or thin high-contrast outline — NOT the same heavy cartoon stroke as other variants. Keep it premium and restrained.
- **Casing** — Title Case or refined sentence case often reads more "premium" than shouting ALL CAPS; choose what fits the title length.
- **Lockup** — Tighter, elegant line breaks; optional slight letter-spacing on short titles for authority.
`.trim()
  }

  return `
## TYPOGRAPHY & TITLE STYLE — THIS VARIANT: ARTISTIC / BOLD

${common}

- **Expressive letterforms** — hand-painted brush energy, poster ink, sticker die-cut, comic halftone inside letters, or masked type inside a shape — still fully readable at small preview size.
- **Color play** — duotone fills, split-color letters, gradient mesh on type, or unexpected outline color (e.g. coral halo on teal letters). Harmonize with the thumbnail but avoid repeating the same white/black formula.
- **Layout** — curved text on a gentle arc, stacked staggered lines, or one word on a slight angle — only if it stays readable and words stay complete.
- **Texture** — light grain, speckle, or print texture on letters is OK if it does not hurt legibility.
- **Casing** — mixed case or selective emphasis on one phrase from the title is allowed if it adds character (words still from the title only).
`.trim()
}

function buildOverlayTextGuidance(videoTitle: string): string {
  const t = videoTitle.trim()
  if (!t) return ""

  const wordCount = t.split(/\s+/).length

  return `
## ON-IMAGE TEXT — CRITICAL (READ EVERY RULE)

**Creator's exact title:**
"${t}"

### TEXT CONTENT RULES:
1. **Use the FULL title as-is** — The text on the thumbnail should be the user's title or a very close version of it. Keep ALL key words. You may ONLY shorten if the title is longer than ~8 words, and even then keep the core message intact.
${wordCount <= 6
      ? `2. **This title is short enough — use it EXACTLY as written.** Do NOT drop or change any words. Render: "${t}"`
      : `2. **This title has ${wordCount} words — you may trim filler words** (a, the, my, to, and, in, for, of) but keep every noun, verb, number, and adjective. The trimmed version MUST still read as the same claim/story.`
    }
3. **NEVER invent new words** — Do NOT add "SHOCKING", "WOW", "INSANE", or ANY word not in the original title above.
4. **NEVER chop words** — Every word must be COMPLETE. No partial words, no letters cut off at edges. If a word doesn't fit, adjust size, line break, or letter-spacing — do NOT truncate the word.
5. **Numbers and symbols are sacred** — Keep them exactly ($200k, 10X, 24H, etc.).

### READABILITY (non-negotiable — creativity must still pass these):
6. **Fully visible** — No letter or word clipped by the image edge. Leave at least 5% padding from every edge.
7. **1–2 lines** — Long titles: break at natural phrase boundaries.
8. **Mobile preview** — Must stay readable at ~120×68px: bold enough weight, enough contrast vs background (outline, glow, scrim, or solid plate behind type are all OK).
9. **Minimum impact size** — Title block should feel LARGE (roughly ≥15% of frame height for the main line); never timid tiny captions.
10. **Creativity encouraged** — Font personality, fill color, outline/glow color, casing, and effects should follow the **TYPOGRAPHY & TITLE STYLE** section for THIS variant. Rotate away from the same font+color+effect on every image.

### TEXT PLACEMENT:
11. **Breathing room** — Place in the clearest negative space (corners/edges typical).
12. **NEVER over a face** — Text must not overlap or obscure any person's face.
13. **Contrast** — If the background is busy, add a gradient scrim, soft panel, or glow so type stays legible without defaulting to identical styling every time.
`.trim()
}

function buildImageContext(images: ClassifiedImage[]): string {
  if (!images.length) return ""

  const lines: string[] = ["UPLOADED IMAGES — use each exactly as described:"]

  images.forEach((img, i) => {
    const n = i + 1
    const label = img.label ?? img.category

    switch (img.category) {
      case "person":
        lines.push(
          `IMAGE ${n} — PERSON / SUBJECT:`,
          `  This is ${label}. This person is the MAIN HUMAN SUBJECT of the thumbnail.`,
          `  Keep their face, likeness, and identity clearly recognisable.`,
          `  Position them as the dominant foreground element, filling 50–70% of the frame.`,
          `  Do NOT alter their appearance. Do NOT obscure their face with text.`
        )
        break
      case "background":
        lines.push(
          `IMAGE ${n} — BACKGROUND / SCENE:`,
          `  This is ${label}. Use this as the background environment or scene for the thumbnail.`,
          `  If a person image is also provided, composite the person INTO this scene naturally.`,
          `  Adjust lighting and color grading to make the person look like they belong there.`
        )
        break
      case "props":
        lines.push(
          `IMAGE ${n} — PROPS / OBJECTS:`,
          `  This is ${label}. These objects should appear in the thumbnail as supporting visual elements.`,
          `  Incorporate them naturally alongside the main subject.`,
          `  Size and position them to reinforce the story of the video title.`
        )
        break
      case "reference_style":
        lines.push(
          `IMAGE ${n} — STYLE & COLOR REFERENCE (CRITICAL — follow closely):`,
          `  This is ${label}. The user wants their thumbnail to look and feel like this one.`,
          ``,
          `  STUDY and REPLICATE these elements:`,
          `  • COLOR PALETTE — Extract the exact dominant colors from this image and USE THEM.`,
          `    If the reference is orange/black, the new thumbnail must also be orange/black.`,
          `    Match saturation, brightness, and contrast levels as closely as possible.`,
          `  • COMPOSITION — Copy the layout logic: where is the subject placed? What takes up`,
          `    most of the frame? How is negative space used? Replicate the spatial feel.`,
          `  • LIGHTING & MOOD — Match the vibe: dramatic & dark, bright & energetic, etc.`,
          `  • TEXT STYLE — Match font weight, placement zone, and size ratio if there is text.`,
          `    BUT replace the actual words with a hook for THIS video's title (see text rules above).`,
          `  • BACKGROUND TREATMENT — Blurred? Gradient? Illustrated? Solid? Replicate it.`,
          ``,
          `  WHAT NOT TO COPY:`,
          `  • Do NOT copy the reference thumbnail's subject / person (use the user's uploaded person instead if provided).`,
          `  • Do NOT copy the reference's on-image words — generate a fresh hook for THIS video.`
        )
        break
      case "before_after":
        lines.push(
          `IMAGE ${n} — BEFORE / AFTER COMPARISON:`,
          `  This is ${label}. This image represents a transformation or comparison.`,
          `  Use it to show the dramatic contrast in the thumbnail — either show the "after" state`,
          `  prominently, or split the frame to hint at the transformation without revealing the full result.`
        )
        break
      case "text_graphic":
        lines.push(
          `IMAGE ${n} — TEXT / GRAPHIC ASSET:`,
          `  This is ${label}. This is a logo, graphic, or branded asset.`,
          `  Incorporate it into the thumbnail design — position it in a corner or edge`,
          `  where it adds credibility without competing with the main subject.`
        )
        break
      default:
        lines.push(
          `IMAGE ${n} — ADDITIONAL REFERENCE:`,
          `  This is ${label}. Use your best judgement to incorporate it`,
          `  into the thumbnail in a way that strengthens the story.`
        )
    }
  })

  const categories = new Set(images.map((img) => img.category))
  const personCount = images.filter((img) => img.category === "person").length
  const has = (c: ImageCategory) => categories.has(c)

  lines.push("", "COMPOSITION INTENT:")

  if (has("person") && has("background") && has("props")) {
    lines.push(
      "  FULL COMPOSITE: Place the person(s) inside the background scene, with props",
      "  naturally positioned. Create a cohesive, staged scene that tells the video story."
    )
  } else if (has("person") && has("background")) {
    lines.push(
      "  PERSON IN SCENE: Composite the person into the background naturally.",
      "  Match lighting and shadows so they look like they were photographed there."
    )
  } else if (has("person") && has("props")) {
    lines.push(
      "  PERSON WITH PROPS: Place the props around or near the person.",
      "  Generate a background that complements both and fits the video title."
    )
  } else if (personCount > 1) {
    lines.push(
      `  MULTIPLE SUBJECTS: ${personCount} people must ALL appear clearly in the thumbnail.`,
      "  Arrange them naturally — do not obscure any face. Generate a fitting background."
    )
  } else if (has("person")) {
    lines.push(
      "  SINGLE SUBJECT: The person is the hero. Generate a background that supports",
      "  the video title and makes the person pop visually."
    )
  } else if (has("background") || has("props")) {
    lines.push(
      "  NO PERSON: Create a compelling, subject-free thumbnail using the provided",
      "  materials. Use strong visual hierarchy and a clear focal point."
    )
  } else if (has("reference_style")) {
    lines.push(
      "  STYLE-DRIVEN CREATION: Use the reference thumbnail's aesthetic as your guide.",
      "  Create a completely new thumbnail that captures the same visual energy,",
      "  composition style, and emotional impact for this new video title."
    )
  }

  return lines.join("\n")
}

function buildAiPersonBlock(req: GenerateImagesRequest): string {
  if (!req.useAiPerson || req.images.some((img) => img.category === "person")) return ""

  return `
## AI-GENERATED PERSON (user opted-in)

The user does NOT have a personal photo — generate an attractive, realistic-looking person as the thumbnail's main subject.

Rules:
- Create a person whose appearance and expression naturally fits the video title.
- Choose gender, ethnicity, age, clothing, and expression that make contextual sense (e.g. a finance video → professional-looking adult, a travel vlog → casual explorer).
- The person should display an EXPRESSIVE, exaggerated emotion relevant to the title (shock, excitement, disbelief, joy, etc.).
- Place the person as the dominant foreground element (50–70% of the frame).
- Photorealistic quality — like a high-end camera portrait, not cartoonish.
- The AI-generated person should look like a real YouTuber, NOT a stock photo model.
`.trim()
}

function buildNoPersonSubjectBlock(req: GenerateImagesRequest): string {
  const hasPersonImage = req.images.some((img) => img.category === "person")
  if (req.useAiPerson || hasPersonImage) return ""

  return `
## NO HUMAN SUBJECT (required)

The user did not upload a person photo and did not enable an AI-generated person.

Create a thumbnail with **no prominent human face, body, or realistic person** as the focus. The hero visual must be something else: objects, a device or screen showing UI, scenery, diagrams, bold typography, icons, abstract graphics, or branded elements that fit the title.

Do not invent a stock-photo-style person or influencer face — there must be no human as the main subject.
`.trim()
}

function buildScenarioBlock(req: GenerateImagesRequest): string {
  const categories = new Set(req.images.map((img) => img.category))
  const has = (c: ImageCategory) => categories.has(c)
  const noUploadedImages = req.images.filter((i) => i.category !== "reference_style").length === 0
  const personCount = req.images.filter((i) => i.category === "person").length

  const lines: string[] = ["## SCENARIO ANALYSIS"]

  if (noUploadedImages && !req.useAiPerson) {
    lines.push(
      "",
      "The user did NOT upload any personal photos, backgrounds, or props.",
      "Create the thumbnail ENTIRELY from scratch based on the video title.",
      has("reference_style")
        ? "Use the style reference image to guide your colors, composition, and mood."
        : "Choose a visual concept that best tells the story of the video title.",
      "Do not add a human as the main subject — follow the NO HUMAN SUBJECT rules (objects, type, graphics, or environment only)."
    )
  } else if (noUploadedImages && req.useAiPerson) {
    lines.push(
      "",
      "The user has no uploaded photos but wants an AI-generated person.",
      has("reference_style")
        ? "Create a thumbnail with an AI-generated person, styled after the reference image."
        : "Create a thumbnail with an AI-generated person and an appropriate background for the title."
    )
  }

  if (has("unknown") || (has("props") && !has("person") && !has("background"))) {
    lines.push(
      "",
      "SMART IMAGE USAGE:",
      "Some uploaded images may be screenshots, product photos, memes, or other non-standard content.",
      "Understand what the image REPRESENTS and use it creatively:",
      "- Screenshot of an app/website → show it on a phone/laptop screen in the thumbnail",
      "- Product photo → feature it prominently as a key visual element",
      "- Meme/graphic → incorporate it as part of the visual story",
      "- Chart/data → display it in a way that creates curiosity",
      "- Screenshot of results/numbers → make it a focal point that drives clicks",
      "Always integrate uploaded content NATURALLY — don't just paste it flat."
    )
  }

  if (has("before_after")) {
    lines.push(
      "",
      "BEFORE/AFTER: The user uploaded a transformation image.",
      "Create a dramatic split or reveal composition showing the contrast."
    )
  }

  if (has("text_graphic")) {
    lines.push(
      "",
      "BRANDING: The user uploaded a logo or branded graphic.",
      "Include it tastefully — corner placement, don't let it dominate the thumbnail."
    )
  }

  if (personCount > 1) {
    lines.push(
      "",
      `MULTI-PERSON (${personCount} people): Arrange ALL people so every face is clearly visible.`,
      "Consider reaction-style layout, side-by-side, or group photo composition."
    )
  }

  return lines.join("\n")
}

function buildCoreRules(
  req: GenerateImagesRequest,
  strategy: GeneratedVariant["strategy"]
): string {
  return `
${buildOverlayTextGuidance(req.title)}

${buildVariantTypographyGuidance(strategy)}

## THUMBNAIL DESIGN — PROFESSIONAL QUALITY STANDARDS

You are creating a PREMIUM YouTube thumbnail that would look at home on a channel with 10M+ subscribers. Every design choice must be intentional and polished.

### TEXT ON THUMBNAIL (summary of rules above):
- Render the user's title (or a faithful shortened version) — see the detailed text rules above.
- EVERY word must be COMPLETE — no clipping, no truncation, no partial words.
- **Typographic variety** — Follow the TYPOGRAPHY & TITLE STYLE block for this variant (font personality, colors, effects, casing). Do NOT reuse the same title treatment across variants.
- Strong contrast vs background (outline, glow, scrim, or plate — your choice to match the variant).
- Place in a corner/edge zone with breathing room — NEVER over a face.
- If text is long, split into 2 lines with natural phrase breaks.
- Add a subtle gradient or shadow behind text if the background is busy.

### COMPOSITION & LAYOUT:
- **ONE clear focal point** — the eye must know exactly where to go within 0.5 seconds.
- **Subject fills 50–75% of the frame** — tight framing creates intimacy and impact.
- **Rule of thirds** — place the main subject off-center for dynamic tension.
- **Strong figure-ground separation** — the subject must POP against the background through contrast, depth of field blur, color difference, or rim lighting.
- **Visual depth** — create layers (foreground subject, mid-ground elements, background) for a cinematic 3D feel.
- **Show the OUTCOME, not the process** — thumbnails that show results get more clicks.
- **Negative space is strategic** — use it for text placement and visual breathing room.

### FACIAL EXPRESSION (when faces are present):
- **Exaggerated, authentic emotion** — surprise (wide eyes, open mouth), excitement, disbelief, joy.
- Faces with genuine emotion get 30%+ more CTR than neutral expressions.
- The expression must match the title's emotional tone.
- Eyes should be clearly visible and well-lit — they are the #1 attention magnet.

### LIGHTING & COLOR GRADING:
- **Cinematic lighting** — use dramatic rim/edge lighting to separate subject from background.
- **Color grading** — apply professional color grading (teal & orange, warm golden, cool blue, etc.) for a polished film look.
- ${req.colorTheme
      ? `Use exactly this color direction: ${req.colorTheme} (primary, secondary, accent)`
      : "AUTO — choose a bold, high-contrast color palette that fits the video title's mood. Prefer saturated, vibrant tones (not muted/pastel)."
    }
- **Maximum 3 dominant colors** — a focused palette reads better at small sizes.
- **Bright, saturated colors** beat muted tones for CTR (unless the title demands a moody/dark aesthetic).
- **Background should complement, not compete** — slightly desaturate or blur the background if the subject needs to stand out more.

### CTR PSYCHOLOGY:
- **Curiosity gap** — viewers should feel they MUST click to find out what happens.
- **Partial reveals** — hint at the payoff without fully showing it.
- **Numbers and symbols** — if the title contains numbers ($200k, 10X, 24H), make them visually prominent.
- **Contrast and surprise** — unexpected juxtapositions or dramatic before/after implications grab attention.
- **Emotional resonance** — the thumbnail should trigger an immediate emotional response.

### TECHNICAL QUALITY:
- **Resolution & sharpness** — the image must look crisp and professional, not blurry or AI-artifacted.
- **Clean edges** — no messy compositing, halos, or unnatural blending between elements.
- **Mobile-first readability** — everything (text, expression, key elements) must be readable at 120×68px.
- **No clutter** — remove any element that doesn't serve the story. Less is more.
- **No watermarks, no borders, no timestamps** — clean professional output.

**Style:** ${req.style || "bold, cinematic, eye-catching, premium quality"}
**Format:** 16:9 landscape YouTube thumbnail (1280×720 equivalent)`.trim()
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildImageParts(images: ClassifiedImage[]): Part[] {
  return images.map((img) => ({
    inlineData: { mimeType: img.mimeType, data: img.base64 },
  }))
}

function extractFromParts(parts: Part[]): { imageBase64: string; description: string } | null {
  let imageBase64: string | null = null
  let description = ""
  for (const part of parts) {
    if (part.text) description = part.text
    else if (part.inlineData?.data) imageBase64 = part.inlineData.data
  }
  return imageBase64 ? { imageBase64, description } : null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false

  const status = (err as { status?: number }).status
  if (status === 429 || status === 503 || status === 504) return true

  const message = (err as Error).message ?? JSON.stringify(err)
  return (
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes('"code":429') ||
    message.includes("fetch failed") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNRESET") ||
    message.includes("EAI_AGAIN") ||
    message.includes("socket hang up") ||
    message.includes("ECONNABORTED")
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function generateThumbnailImages(req: GenerateImagesRequest): Promise<GeneratedVariant[]> {
  const ai = getVertexGenAI()
  const imageParts = buildImageParts(req.images)
  const imageCtx = buildImageContext(req.images)
  const count = Math.min(Math.max(1, req.variantCount), 3) as 1 | 2 | 3
  const configs = VARIATION_CONFIGS.slice(0, count)

  const results: GeneratedVariant[] = []
  const MAX_ATTEMPTS = 4

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i]!
    const coreRules = buildCoreRules(req, config.strategy)

    const fullPrompt = [
      `You are a world-class thumbnail designer who creates viral, click-worthy YouTube thumbnails used by creators with millions of subscribers.`,
      "",
      `Create a PREMIUM, high-CTR YouTube thumbnail for this video.`,
      `Video title: "${req.title}"`,
      "",
      `THUMBNAIL TEXT RULE (non-negotiable):`,
      `- The text on the thumbnail MUST be the user's title or a faithful shortened version of it.`,
      `- Use ONLY words from the title above. Do NOT invent new words, hooks, or clickbait terms.`,
      `- EVERY word must be FULLY rendered — no clipping, no truncation, no partial words.`,
      `- If the title is 6 words or fewer, use it EXACTLY as written.`,
      "",
      buildScenarioBlock(req),
      "",
      buildAiPersonBlock(req),
      "",
      buildNoPersonSubjectBlock(req),
      "",
      imageCtx,
      "",
      req.prompt?.trim() ? `CREATOR INSTRUCTIONS (follow closely): "${req.prompt.trim()}"` : "",
      "",
      coreRules,
      "",
      `VARIATION STYLE: ${config.direction}`,
      "Make this variant visually distinct: different layout, lighting, color grading, AND a clearly different **title typography** (font personality, colors, casing, effects) from the other variants — while the words on the thumbnail still come only from the user's title.",
      "",
      `FINAL CHECKLIST before generating:`,
      `1. Is the text on the thumbnail the user's actual title (or faithful short version)? ✓`,
      `2. Is every word COMPLETE and fully visible (no clipping)? ✓`,
      `3. Is the title readable at mobile preview size — with a fresh typographic treatment (not copy-pasted styling)? ✓`,
      `4. Does the thumbnail look like it belongs on a 10M+ subscriber channel? ✓`,
      `5. Would YOU click on this thumbnail? ✓`,
    ]
      .filter(Boolean)
      .join("\n")

    const contents = req.images.length > 0
      ? [
          { role: "user" as const, parts: imageParts },
          { role: "user" as const, parts: [{ text: fullPrompt }] },
        ]
      : fullPrompt

    let variant: GeneratedVariant | null = null

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: IMAGE_MODEL,
          contents: contents as Parameters<typeof ai.models.generateContent>[0]["contents"],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
          },
        })

        const parts = response.candidates?.[0]?.content?.parts ?? []
        const extracted = extractFromParts(parts)
        if (!extracted) break

        variant = { ...extracted, strategy: config.strategy }
        break
      } catch (err) {
        if (!isRetryableError(err) || attempt === MAX_ATTEMPTS - 1) {
          console.error(`[Gemini] Variant "${config.strategy}" failed:`, err)
          break
        }
        const delay = Math.round(1800 * 2 ** attempt + Math.random() * 600)
        console.warn(`[Gemini] Variant "${config.strategy}" retrying in ${delay}ms (${attempt + 2}/${MAX_ATTEMPTS})`)
        await sleep(delay)
      }
    }

    if (variant) results.push(variant)
    if (i < configs.length - 1) await sleep(450)
  }

  return results
}