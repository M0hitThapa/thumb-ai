import type {
  GenerateConceptsOptions,
  ThumbnailAnalysisResult,
  ThumbnailConcept,
} from "@/lib/types"
import { getVertexGenAI } from "./vertex-genai"

const TEXT_MODEL = "google/gemini-3.1-pro-preview"

export async function generateThumbnailConcepts(
  options: GenerateConceptsOptions
): Promise<ThumbnailAnalysisResult> {
  const { title, style, colorTheme } = options
  const ai = getVertexGenAI()

  const prompt = `You are a world-class YouTube thumbnail strategist and text expert. Generate 3 GENUINELY DISTINCT thumbnail concepts.

## VIDEO CONTEXT
Title (user's video title — use for context, NOT as literal thumbnail text): "${title}"
Platform: YouTube
${style ? `Visual Style hint: ${style}` : ""}
${colorTheme ? `Color Theme hint: ${colorTheme}` : ""}

Infer channel niche, audience, and emotion **only from this title** — no separate niche or age fields exist.

## ON-THUMBNAIL TEXT — STRATEGIC (not literal)

You are a thumbnail TEXT STRATEGIST. Do NOT just paste the video title onto the thumbnail.

### Text Selection Rules:
- **Max 4 words** (prefer 1–3). Short = powerful.
- First decide: does this thumbnail NEED text? If the visual is strong enough, skip text entirely.
- Text must create CURIOSITY, EMOTION, or TENSION — NOT repeat the title.
- Use patterns like: Curiosity Gap ("No One Knows"), Shock ("This Changed Everything"), Contrarian ("Stop Doing This"), Result ("$0 → $10K"), Question ("Why Yours Fail?"), Urgency ("Before It's Too Late").
- **Reject text that:** has >4 words, contains filler words, repeats title meaning exactly, has no emotional trigger.
- Keep numbers/symbols exactly ($200k, 10X, etc.) — numbers are powerful standalone text.
- EVERY word must be COMPLETE — no partial words, no letters cut off.

### When to SKIP text:
- Face expression is very strong and tells the story
- Visual already tells the story (before/after, recognizable object)
- Set "thumbnailText" to "" and "use_text" to false

### Text placement
- Corner or edge only. NEVER on a face.
- Text can span 1–2 lines. Bold, thick font. High contrast.

### Archetypes & CTR
Curiosity gap, authority/value, shock/emotion — high contrast, outcome-focused, saturated colors unless color hint says otherwise.

Return ONLY valid JSON:
{
  "concepts": [
    {
      "id": "concept_1",
      "title": "Strategy name e.g. 'The Curiosity Gap'",
      "headline": "Short high-impact text (max 4 words) or empty if no text needed",
      "subheadline": "Optional secondary text (1-2 words max)",
      "use_text": true,
      "thumbnailText": "The final text on the thumbnail (max 4 words, or empty string if skipping text)",
      "textPlacement": "top-left | top-right | bottom-left | bottom-right",
      "textStyle": "e.g. Bold Impact white with black stroke",
      "visualDescription": "4–5 sentences; text vs face placement",
      "backgroundDescription": "...",
      "subjectDescription": "...",
      "composition": "...",
      "lighting": "...",
      "colorPalette": ["#hex1", "#hex2", "#hex3"],
      "fontStyle": "...",
      "emojiAccents": ["🔥"],
      "props": ["..."],
      "designTips": ["...", "...", "..."],
      "ctrScore": 87,
      "ctrReasoning": "...",
      "psychologyTrigger": "curiosity",
      "strategy": "curiosity",
      "emotionalImpact": "...",
      "platformOptimisation": "..."
    }
  ],
  "generalAdvice": "...",
  "autoInferences": {
    "detectedEmotion": "...",
    "recommendedColors": "...",
    "platformTip": "..."
  },
  "avoidList": ["...", "...", "...", "..."],
  "bestPractices": ["...", "...", "...", "..."]
}`

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.65,
      maxOutputTokens: 4000,
    },
  })

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("No response from Vertex AI")

  const cleaned = text
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim()

  const parsed = JSON.parse(cleaned) as {
    concepts: ThumbnailConcept[]
    generalAdvice: string
    autoInferences?: {
      detectedEmotion: string
      recommendedColors: string
      platformTip: string
    }
    avoidList: string[]
    bestPractices: string[]
  }

  return {
    title,
    style: style ?? "Auto",
    colorTheme: colorTheme ?? "Auto",
    ...parsed,
  }
}
