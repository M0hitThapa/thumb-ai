import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { GoogleGenAI } from "@google/genai"
import { apiError, validationError } from "@/lib/api-error"

export const maxDuration = 15

const CLASSIFY_MODEL = "gemini-3-flash-preview" as const

const Schema = z.object({
  base64: z.string().min(1),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
})

export type ImageCategory =
  | "person"
  | "background"
  | "props"
  | "reference_style"
  | "before_after"
  | "text_graphic"
  | "unknown"

export interface ClassifyResult {
  category: ImageCategory
  label: string
  description: string
  hasFace: boolean
}

const ClassifyResultSchema = z.object({
  category: z.enum([
    "person",
    "background",
    "props",
    "reference_style",
    "before_after",
    "text_graphic",
    "unknown",
  ]),
  label: z.string().max(300).default(""),
  description: z.string().max(600).default(""),
  hasFace: z.boolean().default(false),
})

function parseClassifyResponse(raw: string): ClassifyResult | null {
  let t = raw.trim().replace(/^\uFEFF/, "")

  if (/^```/m.test(t)) {
    t = t
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim()
  }

  const start = t.indexOf("{")
  const end = t.lastIndexOf("}")
  if (start >= 0 && end > start) {
    t = t.slice(start, end + 1)
  }

  try {
    const parsed: unknown = JSON.parse(t)
    const out = ClassifyResultSchema.safeParse(parsed)
    if (out.success) return out.data
  } catch {}
  return null
}

const FALLBACK_RESULT: ClassifyResult = {
  category: "unknown",
  label: "Uploaded image",
  description:
    "Use this image as a supporting visual in the thumbnail composition.",
  hasFace: false,
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return apiError("Unauthorized", 401)

    const parsed = Schema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { base64, mimeType } = parsed.data

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    const prompt = `You are an AI that classifies images for YouTube thumbnail generation.

The user is building a thumbnail. They can upload ANYTHING — their own face, a screenshot, a product photo, a meme, a chart, scenery, a logo, another YouTube thumbnail for style reference, etc.

Your job: figure out WHAT this image is and HOW it should be used in a thumbnail.

Return ONLY valid JSON — no markdown, no explanation:
{
  "category": "<one of: person | background | props | reference_style | before_after | text_graphic | unknown>",
  "label": "<10 words max describing what is in the image>",
  "description": "<1-2 sentences describing how this image should be used in a YouTube thumbnail>",
  "hasFace": <true if a human face is clearly visible, false otherwise>
}

Category definitions (pick the BEST fit):
- person: a human subject — selfie, portrait, full body photo, or any image where a person is clearly the main focus and likely wants to appear AS the subject in the thumbnail. Multiple people also counts.
- background: a scene, location, room, landscape, city, nature, studio backdrop, or any setting suited as a background layer.
- props: objects, products, items, screenshots, app UIs, code, charts, data, money, cars, gadgets, food, results screenshots, social media posts, earnings dashboards — anything the user wants to FEATURE or SHOWCASE in the thumbnail as a supporting visual. This is a broad category for "show this thing in my thumbnail".
- reference_style: looks like an existing YouTube thumbnail, design mockup, or visual reference the user wants to replicate the style of. Usually has text overlay + subject + styled composition. If it looks like a finished YouTube thumbnail, choose this.
- before_after: shows a clear comparison, transformation, weight loss, makeover, two states (before/after, old/new, less/more).
- text_graphic: a logo, brand mark, watermark, icon, or graphic overlay asset to incorporate.
- unknown: genuinely cannot determine what this is or how it should be used.

IMPORTANT:
- Screenshots of apps, websites, dashboards, code, social media, or results → classify as "props" (not unknown). Describe WHAT it shows.
- Memes or reaction images with a clear person → "person" if the person is the focus; "props" if the meme itself is the content to display.
- Multiple people in one image → still "person". Mention the count in the label.
- A finished-looking YouTube thumbnail → "reference_style".`

    const response = await ai.models.generateContent({
      model: CLASSIFY_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return apiError("Classification failed", 500)

    const result = parseClassifyResponse(text) ?? FALLBACK_RESULT
    return NextResponse.json(result)
  } catch (err) {
    console.error("Classify image error:", err)
    return apiError("Internal server error")
  }
}
