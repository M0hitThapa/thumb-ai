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

  const prompt = `You are a world-class YouTube thumbnail strategist. Generate 3 GENUINELY DISTINCT thumbnail concepts.

## VIDEO CONTEXT
Title (exact user input — treat as sacred wording for on-thumbnail text): "${title}"
Platform: YouTube
${style ? `Visual Style hint: ${style}` : ""}
${colorTheme ? `Color Theme hint: ${colorTheme}` : ""}

Infer channel niche, audience, and emotion **only from this title** — no separate niche or age fields exist.

## ON-THUMBNAIL TEXT — STRICT

For **headline**, **thumbnailText**, and overlay copy:
- Use the user's **FULL title** "${title}" or a very close version of it. Keep ALL key words.
- You may ONLY shorten if the title is longer than ~8 words — even then, keep every noun, verb, number, and adjective. Only drop filler words (a, the, to, my, and, in, for, of).
- The shortened version MUST still read as the same claim/story as the original.
- Keep numbers/symbols exactly ($200k, 10X, etc.).
- Do NOT invent new words or unrelated hooks (e.g. "SHOCKING" if not in the title).
- EVERY word must be COMPLETE — no partial words, no letters cut off.

**Good:** Title "I Quit My $200k Job to Travel" → "I QUIT MY $200K JOB TO TRAVEL" (full title) or "QUIT MY $200K JOB TO TRAVEL" (dropped only "I").
**Bad:** "QUIT $200K JOB" (too much lost) or "SHOCKING JOB QUIT" (invented words).

### Text placement
- Corner or edge only (top-left, top-right, bottom-left, bottom-right). Never on a face.
- Text can span 1–2 lines if needed. Break at natural phrase points.

### Archetypes & CTR
Curiosity gap, authority/value, shock/emotion — high contrast, outcome-focused, saturated colors unless color hint says otherwise.

Return ONLY valid JSON:
{
  "concepts": [
    {
      "id": "concept_1",
      "title": "Strategy name e.g. 'The Curiosity Gap'",
      "headline": "Full title or faithful shortened version",
      "subheadline": "Optional; from user title",
      "thumbnailText": "Full title or close version — every word complete, no clipping",
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
