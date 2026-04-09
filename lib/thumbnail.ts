import { GoogleGenAI } from "@google/genai"


function getClient(): GoogleGenAI {
  const project = process.env.GOOGLE_CLOUD_PROJECT
  const location = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1"

  if (!project) throw new Error("GOOGLE_CLOUD_PROJECT is not set")

  return new GoogleGenAI({
    vertexai: true,
    project,
    location,
    // Vercel: set GOOGLE_CLOUD_API_KEY in env vars
    // Local:  leave unset — ADC from `gcloud auth application-default login` handles it
    ...(process.env.GOOGLE_CLOUD_API_KEY
      ? { apiKey: process.env.GOOGLE_CLOUD_API_KEY }
      : {}),
  })
}

const TEXT_MODEL = "google/gemini-3.1-pro-preview"


export interface ThumbnailConcept {
  id: string
  title: string
  headline: string
  subheadline?: string
  thumbnailText?: string
  textPlacement?: string
  textStyle?: string
  visualDescription: string
  backgroundDescription: string
  subjectDescription?: string
  composition?: string
  lighting?: string
  colorPalette: string[]
  fontStyle: string
  emojiAccents: string[]
  props?: string[]
  designTips: string[]
  ctrScore: number
  ctrReasoning: string
  psychologyTrigger: string
  strategy: "curiosity" | "authority" | "shock" | "emotion" | "value"
  emotionalImpact?: string
  platformOptimisation?: string
}

export interface ThumbnailAnalysisResult {
  topic: string
  style: string
  colorTheme: string
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

export interface GenerateConceptsOptions {
  topic: string
  style?: string
  colorTheme?: string
  userId: string
}


export async function generateThumbnailConcepts(
  options: GenerateConceptsOptions
): Promise<ThumbnailAnalysisResult> {
  const { topic, style, colorTheme } = options
  const ai = getClient()

  const prompt = `You are a world-class YouTube thumbnail strategist. Generate 3 GENUINELY DISTINCT thumbnail concepts.

## VIDEO CONTEXT
Title (exact user input — treat as sacred wording for on-thumbnail text): "${topic}"
Platform: YouTube
${style ? `Visual Style hint: ${style}` : ""}
${colorTheme ? `Color Theme hint: ${colorTheme}` : ""}

Infer channel niche, audience, and emotion **only from this title** — no separate niche or age fields exist.

## ON-THUMBNAIL TEXT — STRICT

For **headline**, **thumbnailText**, and overlay copy:
- Use **only words from the user's title** "${topic}", or a **short contiguous phrase** cut from it.
- Hard limit: **3 to 5 words** on the thumbnail (max 5; prefer 3–4).
- You may omit tiny words (a, the, to, my) only to fit; do NOT add new nouns/verbs the user did not write.
- Keep numbers/symbols exactly ($200k, 10X, etc.).
- Do NOT invent unrelated hooks (e.g. "SHOCKING" if not in the title).

**Good:** Title "I Quit My $200k Job to Travel" → "QUIT MY $200K JOB" (≤5 words).
**Bad:** New phrase with words not in the title.

### Text placement
- Corner or edge only (top-left, top-right, bottom-left, bottom-right). Never on a face.

### Archetypes & CTR
Curiosity gap, authority/value, shock/emotion — high contrast, outcome-focused, saturated colors unless color hint says otherwise.

Return ONLY valid JSON:
{
  "concepts": [
    {
      "id": "concept_1",
      "title": "Strategy name e.g. 'The Curiosity Gap'",
      "headline": "3–5 words from user title only",
      "subheadline": "Optional; from user title, max 6 words",
      "thumbnailText": "3–5 words max from user title",
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
    topic,
    style: style ?? "Auto",
    colorTheme: colorTheme ?? "Auto",
    ...parsed,
  }
}
