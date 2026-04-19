import {
  HarmBlockThreshold,
  HarmCategory,
  Type,
  type Schema,
} from "@google/genai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { apiError, validationError } from "@/lib/api-error"
import { getGoogleGenAI } from "@/lib/google-genai"
import {
  IMAGE_CATEGORY_LIST,
  type ImageCategory,
} from "@/lib/image-category"

export const maxDuration = 30

export type { ImageCategory }

const CLASSIFY_MODEL = "gemini-3-flash-preview" as const

const bodySchema = z.object({
  base64: z.string().min(1).max(5_000_000),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
})

export interface ClassifyResult {
  category: ImageCategory
  label: string
  description: string
  hasFace: boolean
}

const ClassifyResultSchema = z.object({
  category: z.enum(IMAGE_CATEGORY_LIST),
  label: z.string().max(300).default(""),
  description: z.string().max(600).default(""),
  hasFace: z.boolean().default(false),
})

const CLASSIFY_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  propertyOrdering: ["category", "label", "description", "hasFace"],
  properties: {
    category: {
      type: Type.STRING,
      format: "enum",
      enum: [...IMAGE_CATEGORY_LIST],
    },
    label: {
      type: Type.STRING,
      description: "Short phrase, about 10 words max",
    },
    description: {
      type: Type.STRING,
      description:
        "1–2 short sentences; do not use double-quote characters inside",
    },
    hasFace: { type: Type.BOOLEAN },
  },
  required: ["category", "label", "description", "hasFace"],
}

function parseClassifyResponse(raw: string): ClassifyResult | null {
  let t = raw.trim().replace(/^\uFEFF/, "")

  if (/^```/m.test(t)) {
    t = t
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim()
  }

  const start = t.indexOf("{")
  if (start >= 0) {
    let depth = 0
    let inString = false
    let escape = false
    for (let i = start; i < t.length; i++) {
      const c = t[i]!
      if (inString) {
        if (escape) {
          escape = false
        } else if (c === "\\") {
          escape = true
        } else if (c === '"') {
          inString = false
        }
        continue
      }
      if (c === '"') {
        inString = true
        continue
      }
      if (c === "{") depth++
      else if (c === "}") {
        depth--
        if (depth === 0) {
          t = t.slice(start, i + 1)
          break
        }
      }
    }
  }

  try {
    const parsed: unknown = JSON.parse(t)
    const out = ClassifyResultSchema.safeParse(parsed)
    if (!out.success) {
      console.warn("Invalid AI response shape:", t)
      return null
    }
    return out.data
  } catch (err) {
    console.warn("JSON parse failed:", err)
    return null
  }
}

const FALLBACK_RESULT: ClassifyResult = {
  category: "unknown",
  label: "Unrecognized image content",
  description:
    "Use this image as a supporting visual in the thumbnail composition.",
  hasFace: false,
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return apiError("Unauthorized", 401)

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { base64, mimeType } = parsed.data

    if (!base64 || base64.length < 50) {
      return apiError("Invalid image data", 400)
    }

    const project =
      process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
      process.env.GCP_PROJECT_ID?.trim()
    if (!project) {
      console.error("GOOGLE_CLOUD_PROJECT is not set")
      return apiError("Classification unavailable", 503)
    }

    const ai = getGoogleGenAI()

    const prompt = `You are an AI that classifies images for YouTube thumbnail generation.

The user is building a thumbnail. They can upload ANYTHING — their own face, a screenshot, a product photo, a meme, a chart, scenery, a logo, another YouTube thumbnail for style reference, etc.

Your job: figure out WHAT this image is and HOW it should be used in a thumbnail.

Return ONLY a single JSON object — no markdown, no text before or after.
Use straight double quotes for keys and string values. Do not put double-quote characters inside "label" or "description" (use single quotes for emphasis if needed).
Fields:
- category: one of person | background | props | reference_style | before_after | text_graphic | unknown
- label: ~10 words max, what is in the image
- description: 1–2 short sentences on how to use it in a thumbnail
- hasFace: true only if a human face is clearly visible

Category definitions (pick the BEST fit):
- person: a human subject — selfie, portrait, full body photo, or any image where a person is clearly the main focus.
- background: a scene, location, or setting suited as a background.
- props: objects, screenshots, dashboards, products, UI, charts, etc.
- reference_style: looks like a finished YouTube thumbnail or design reference.
- before_after: shows transformation or comparison.
- text_graphic: logos, icons, overlays.
- unknown: cannot determine.

IMPORTANT:
- Screenshots, dashboards, code → props
- Memes → person if face is focus, else props
- Multiple people → still person
- Finished thumbnails → reference_style`

    const response = await ai.models.generateContent({
      model: CLASSIFY_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: CLASSIFY_RESPONSE_SCHEMA,
        temperature: 0.1,
        maxOutputTokens: 1024,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_IMAGE_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      },
    })

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    if (!text) return apiError("Classification failed", 500)

    const result = parseClassifyResponse(text) ?? FALLBACK_RESULT
    return NextResponse.json(result)
  } catch (err) {
    console.error("Classify image error:", err)
    return apiError("Internal server error")
  }
}
