import { HarmBlockThreshold, HarmCategory, Type } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { apiError, validationError } from "@/lib/api-error"
import { getGoogleGenAI } from "@/lib/google-genai"
import {
  IMAGE_CATEGORY_LIST,
  type ClassifyResult,
  type ImageCategory,
} from "@/lib/types"

export const maxDuration = 30
export type { ClassifyResult, ImageCategory }

const CLASSIFY_MODEL = "gemini-3-flash-preview"

const bodySchema = z.object({
  base64: z.string().min(1).max(5_000_000),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
})

const ClassifyResultSchema = z.object({
  category: z.enum(IMAGE_CATEGORY_LIST),
  label: z.string().max(300).default(""),
  description: z.string().max(600).default(""),
  hasFace: z.boolean().default(false),
})

const FALLBACK_RESULT: ClassifyResult = {
  category: "unknown",
  label: "Unrecognized image content",
  description:
    "Use this image as a supporting visual in the thumbnail composition.",
  hasFace: false,
}

const PROMPT = `You are an AI that classifies images for YouTube thumbnail generation.
Return ONLY a JSON object with these fields:
- category: person | background | props | reference_style | before_after | text_graphic | unknown
- label: ~10 words max describing the image
- description: 1–2 sentences on how to use it in a thumbnail (no double quotes inside)
- hasFace: true only if a human face is clearly visible

Category rules:
- person: human is the main focus (selfie, portrait, group, meme with face)
- background: scene or setting suited as a backdrop
- props: objects, screenshots, dashboards, products, charts, UI
- reference_style: looks like a finished YouTube thumbnail
- before_after: shows transformation or comparison
- text_graphic: logos, icons, overlays
- unknown: cannot determine`

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return apiError("Unauthorized", 401)

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) return validationError(parsed.error)

  const { base64, mimeType } = parsed.data

  const project =
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GCP_PROJECT_ID?.trim()
  if (!project) return apiError("Classification unavailable", 503)

  try {
    const response = await getGoogleGenAI().models.generateContent({
      model: CLASSIFY_MODEL,
      contents: [
        { role: "user", parts: [{ text: PROMPT }] },
        { role: "user", parts: [{ inlineData: { mimeType, data: base64 } }] },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          propertyOrdering: ["category", "label", "description", "hasFace"],
          properties: {
            category: {
              type: Type.STRING,
              format: "enum",
              enum: [...IMAGE_CATEGORY_LIST],
            },
            label: { type: Type.STRING },
            description: { type: Type.STRING },
            hasFace: { type: Type.BOOLEAN },
          },
          required: ["category", "label", "description", "hasFace"],
        },
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

    const json = JSON.parse(
      text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim()
    )
    const result = ClassifyResultSchema.safeParse(json)

    return NextResponse.json(result.success ? result.data : FALLBACK_RESULT)
  } catch (err) {
    console.error("Classify image error:", err)
    return apiError("Internal server error")
  }
}
