import { type Part } from "@google/genai"
import type { ImageCategory } from "@/lib/image-category"
import { getVertexGenAI } from "./vertex-genai"

const IMAGE_MODEL = "gemini-3.1-flash-image-preview" as const

export interface ClassifiedImage {
  readonly base64: string
  readonly mimeType: string
  readonly category: ImageCategory
  readonly label?: string
  readonly description?: string
  readonly hasFace?: boolean
}

export interface GenerateImagesRequest {
  readonly title: string
  readonly style: string
  readonly colorTheme: string
  readonly images: ClassifiedImage[]
  readonly variantCount: 1 | 2 | 3
  readonly prompt?: string
  readonly useAiPerson?: boolean
}

export interface GeneratedVariant {
  readonly imageBase64: string
  readonly description: string
  readonly strategy: "dramatic" | "clean" | "artistic"
}

interface VariationConfig {
  readonly strategy: "dramatic" | "clean" | "artistic"
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

function buildOverlayTextGuidance(videoTitle: string): string {
  const t = videoTitle.trim()
  if (!t) return ""

  return `
## ON-IMAGE TEXT — CRITICAL

**Creator's title (sacred — only use words from this string):**
"${t}"

1. **Words only from the title above** — Build a phrase from that text only (you may drop "a", "the", "my", "to" to save space). Max **5 words**, ideally **3–4**. Do NOT introduce new nouns/verbs or generic clickbait words not in the title.

2. **Preserve meaning** — Same story as the title; do not rephrase into a different claim.

3. **One line** — Single text block on the thumbnail. ALL CAPS OK. White + black stroke.

4. **Placement** — Corner or edge only; never over a face.
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
  const hasPersons = categories.has("person")
  const hasBackground = categories.has("background")
  const hasProps = categories.has("props")
  const hasReference = categories.has("reference_style")
  const personCount = images.filter((img) => img.category === "person").length

  lines.push("", "COMPOSITION INTENT:")

  if (hasPersons && hasBackground && hasProps) {
    lines.push(
      "  FULL COMPOSITE: Place the person(s) inside the background scene, with props",
      "  naturally positioned. Create a cohesive, staged scene that tells the video story."
    )
  } else if (hasPersons && hasBackground) {
    lines.push(
      "  PERSON IN SCENE: Composite the person into the background naturally.",
      "  Match lighting and shadows so they look like they were photographed there."
    )
  } else if (hasPersons && hasProps) {
    lines.push(
      "  PERSON WITH PROPS: Place the props around or near the person.",
      "  Generate a background that complements both and fits the video title."
    )
  } else if (personCount > 1) {
    lines.push(
      `  MULTIPLE SUBJECTS: ${personCount} people must ALL appear clearly in the thumbnail.`,
      "  Arrange them naturally — do not obscure any face. Generate a fitting background."
    )
  } else if (hasPersons) {
    lines.push(
      "  SINGLE SUBJECT: The person is the hero. Generate a background that supports",
      "  the video title and makes the person pop visually."
    )
  } else if (hasBackground || hasProps) {
    lines.push(
      "  NO PERSON: Create a compelling, subject-free thumbnail using the provided",
      "  materials. Use strong visual hierarchy and a clear focal point."
    )
  } else if (hasReference) {
    lines.push(
      "  STYLE-DRIVEN CREATION: Use the reference thumbnail's aesthetic as your guide.",
      "  Create a completely new thumbnail that captures the same visual energy,",
      "  composition style, and emotional impact for this new video title."
    )
  }

  return lines.join("\n")
}

function hasUserProvidedPersonImage(req: GenerateImagesRequest): boolean {
  return req.images.some((img) => img.category === "person")
}

function buildNoPersonSubjectBlock(req: GenerateImagesRequest): string {
  if (req.useAiPerson) return ""
  if (hasUserProvidedPersonImage(req)) return ""

  return `
## NO HUMAN SUBJECT (required)

The user did not upload a person photo and did not enable an AI-generated person.

Create a thumbnail with **no prominent human face, body, or realistic person** as the focus. The hero visual must be something else: objects, a device or screen showing UI, scenery, diagrams, bold typography, icons, abstract graphics, or branded elements that fit the title.

Do not invent a stock-photo-style person or influencer face — there must be no human as the main subject.
`.trim()
}

function buildAiPersonBlock(req: GenerateImagesRequest): string {
  if (!req.useAiPerson) return ""

  const hasUploadedPerson = hasUserProvidedPersonImage(req)
  if (hasUploadedPerson) return ""

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

function buildScenarioBlock(req: GenerateImagesRequest): string {
  const categories = new Set(req.images.map((img) => img.category))
  const hasPersons = categories.has("person")
  const hasBackground = categories.has("background")
  const hasProps = categories.has("props")
  const hasReference = categories.has("reference_style")
  const hasBeforeAfter = categories.has("before_after")
  const hasTextGraphic = categories.has("text_graphic")
  const hasUnknown = categories.has("unknown")

  const noUploadedImages =
    req.images.filter((i) => i.category !== "reference_style").length === 0

  const lines: string[] = ["## SCENARIO ANALYSIS"]

  if (noUploadedImages && !req.useAiPerson) {
    lines.push(
      "",
      "The user did NOT upload any personal photos, backgrounds, or props.",
      "Create the thumbnail ENTIRELY from scratch based on the video title.",
      hasReference
        ? "Use the style reference image to guide your colors, composition, and mood."
        : "Choose a visual concept that best tells the story of the video title.",
      "Do not add a human as the main subject — follow the NO HUMAN SUBJECT rules (objects, type, graphics, or environment only)."
    )
  } else if (noUploadedImages && req.useAiPerson) {
    lines.push(
      "",
      "The user has no uploaded photos but wants an AI-generated person.",
      hasReference
        ? "Create a thumbnail with an AI-generated person, styled after the reference image."
        : "Create a thumbnail with an AI-generated person and an appropriate background for the title."
    )
  }

  if (hasUnknown || (hasProps && !hasPersons && !hasBackground)) {
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

  if (hasBeforeAfter) {
    lines.push(
      "",
      "BEFORE/AFTER: The user uploaded a transformation image.",
      "Create a dramatic split or reveal composition showing the contrast."
    )
  }

  if (hasTextGraphic) {
    lines.push(
      "",
      "BRANDING: The user uploaded a logo or branded graphic.",
      "Include it tastefully — corner placement, don't let it dominate the thumbnail."
    )
  }

  const personCount = req.images.filter((i) => i.category === "person").length
  if (personCount > 1) {
    lines.push(
      "",
      `MULTI-PERSON (${personCount} people): Arrange ALL people so every face is clearly visible.`,
      "Consider reaction-style layout, side-by-side, or group photo composition."
    )
  }

  return lines.join("\n")
}

function buildCoreRules(req: GenerateImagesRequest): string {
  const overlay = buildOverlayTextGuidance(req.title)

  return `
${overlay}

## THUMBNAIL RULES (visual)

**On-image text (summary):**
- Use **only words from the user's title** (shown in the overlay rules above), 3–5 words max.
- Place text in a CORNER or EDGE — NEVER centred over a face.
- Text MUST NOT overlap any person's face — place it in empty space.
- Bold font, high contrast (white + black stroke), readable at small preview size.

**Composition:**
- ONE clear focal point the eye goes to immediately
- Subject fills 60–80% of the frame
- Strong contrast between subject and background
- Show the OUTCOME or ENDPOINT — not the process
- Faces with authentic, exaggerated emotion maximise CTR
- Prefer strong facial emotion (surprise, excitement, disbelief) when faces are present.

**CTR Psychology:**
- Create a clear curiosity gap: viewers should feel they are missing something if they do not click.
- Use partial reveals, open loops, or dramatic framing to hint at the payoff without fully revealing it.
- If relevant to the title, include powerful numbers/symbols (e.g. "5X", "$10,000", "24H") to increase stopping power.
- Make the hook click-worthy but still honest to what the video is actually about.

**Colours:**
- Bright, saturated hero colours (orange, red, yellow) beat muted tones
- ${
    req.colorTheme
      ? `Use exactly this 3-color direction: ${req.colorTheme} (primary, secondary, accent)`
      : "AUTO — infer the best bold 3-color scheme from the video title and any reference image (if none, pick high-CTR YouTube-style contrast)"
  }
- Maximum 3 dominant colours

**Style:** ${req.style || "bold, cinematic, eye-catching"}
**Format:** 16:9 landscape YouTube thumbnail`.trim()
}

function buildImageParts(images: ClassifiedImage[]): Part[] {
  return images.map((img) => ({
    inlineData: { mimeType: img.mimeType, data: img.base64 },
  }))
}

function extractFromParts(
  parts: Part[]
): { imageBase64: string; description: string } | null {
  let imageBase64: string | null = null
  let description = ""
  for (const part of parts) {
    if (part.text) description = part.text
    else if (part.inlineData?.data) imageBase64 = part.inlineData.data
  }
  if (!imageBase64) return null
  return { imageBase64, description }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Vertex / Gemini quota or burst rate limits (parallel image calls often trigger 429). */
function isResourceExhaustedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const status = (err as { status?: unknown }).status
  if (status === 429) return true
  const message =
    typeof (err as Error).message === "string"
      ? (err as Error).message
      : JSON.stringify(err)
  return (
    message.includes("RESOURCE_EXHAUSTED") || message.includes('"code":429')
  )
}

export async function generateThumbnailImages(
  req: GenerateImagesRequest
): Promise<GeneratedVariant[]> {
  const ai = getVertexGenAI()
  const hasImages = req.images.length > 0
  const imageParts = buildImageParts(req.images)
  const imageCtx = buildImageContext(req.images)
  const coreRules = buildCoreRules(req)
  const count = Math.min(Math.max(1, req.variantCount), 3) as 1 | 2 | 3

  const aiPersonBlock = buildAiPersonBlock(req)
  const noPersonSubjectBlock = buildNoPersonSubjectBlock(req)
  const scenarioBlock = buildScenarioBlock(req)

  const configs = VARIATION_CONFIGS.slice(0, count)
  const results: GeneratedVariant[] = []
  const maxAttempts = 4

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i]!

    const fullPrompt = [
      `Create a high-CTR YouTube thumbnail for this video.`,
      `Video title: "${req.title}"`,
      "",
      `THUMBNAIL TEXT (non-negotiable): ONE short phrase of 3–5 words using ONLY words from the video title string.`,
      `Do not invent new hooks or words that are not in the title.`,
      "",
      scenarioBlock,
      "",
      aiPersonBlock,
      "",
      noPersonSubjectBlock,
      "",
      imageCtx,
      "",
      req.prompt?.trim() ? `CREATOR INSTRUCTIONS: "${req.prompt.trim()}"` : "",
      "",
      coreRules,
      "",
      `VARIATION: ${config.direction}`,
      "Make this variant visually distinct. Same allowed words for text (from title), different layout/lighting.",
    ]
      .filter(Boolean)
      .join("\n")

    const textPart: Part = { text: fullPrompt }
    const allParts: Part[] = [textPart, ...imageParts]

    const contents = hasImages
      ? [{ role: "user" as const, parts: allParts }]
      : fullPrompt

    let variant: GeneratedVariant | null = null

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: IMAGE_MODEL,
          contents: contents as Parameters<
            typeof ai.models.generateContent
          >[0]["contents"],
          config: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "16:9", imageSize: "1K" },
          },
        })

        const candidateParts = response.candidates?.[0]?.content?.parts ?? []
        const extracted = extractFromParts(candidateParts)
        if (!extracted) break

        variant = {
          imageBase64: extracted.imageBase64,
          description: extracted.description,
          strategy: config.strategy,
        }
        break
      } catch (err) {
        const canRetry =
          isResourceExhaustedError(err) && attempt < maxAttempts - 1
        if (canRetry) {
          const delayMs = Math.round(1800 * 2 ** attempt + Math.random() * 600)
          console.warn(
            `[Gemini] Variant "${config.strategy}" hit quota/rate limit (429); retry in ${delayMs}ms (${attempt + 2}/${maxAttempts})`
          )
          await sleep(delayMs)
          continue
        }
        console.error(`[Gemini] Variant "${config.strategy}" failed:`, err)
        break
      }
    }

    if (variant) results.push(variant)

    if (i < configs.length - 1) {
      await sleep(450)
    }
  }

  return results
}
