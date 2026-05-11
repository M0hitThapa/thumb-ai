import { apiError, validationError } from "@/lib/api-error"
import { auth } from "@/lib/auth"
import { generateThumbnailImageStream } from "@/lib/gemini"
import { headers } from "next/headers"
import { NextRequest } from "next/server"
import { z } from "zod"

export const maxDuration = 300

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

const ClassifiedImageSchema = z.object({
  base64: z.string().min(1, "Base64 is required"),
  mimeType: z.string().min(1, "Mime type is required"),
  category: z
    .enum([
      "person",
      "background",
      "props",
      "reference_style",
      "before_after",
      "text_graphic",
      "unknown",
    ])
    .default("unknown"),
  label: z.string().optional(),
  description: z.string().optional(),
  hasFace: z.boolean().optional().default(false),
})

const ImageGenerateSchema = z.object({
  title: z.string().min(3).max(500),
  style: z.string().max(200).optional().default(""),
  colorTheme: z.string().max(200).optional().default(""),
  prompt: z.string().max(500).optional(),
  variantCount: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .optional()
    .default(3),
  images: z.array(ClassifiedImageSchema).max(8).optional().default([]),
  useAiPerson: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return apiError("Unauthorized", 401)
    if (!checkRateLimit(session.user.id))
      return apiError("Rate limit exceeded. Max 3 per minute.", 429)

    const parsed = ImageGenerateSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const {
      title,
      style,
      colorTheme,
      prompt,
      variantCount,
      images,
      useAiPerson,
    } = parsed.data

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let count = 0
          for await (const variant of generateThumbnailImageStream({
            title,
            style,
            colorTheme,
            prompt,
            variantCount,
            images,
            useAiPerson,
          })) {
            const json = JSON.stringify({
              type: "variant",
              variant: {
                imageBase64: variant.imageBase64,
                description: variant.description,
                strategy: variant.strategy,
                imageUrl: "",
              },
            })
            controller.enqueue(encoder.encode(json + "\n"))
            count++
          }

          if (count === 0) {
            const errorJson = JSON.stringify({
              type: "error",
              error: "No images generated. Try a different prompt.",
            })
            controller.enqueue(encoder.encode(errorJson + "\n"))
          }

          const doneJson = JSON.stringify({ type: "done" })
          controller.enqueue(encoder.encode(doneJson + "\n"))
        } catch (err) {
          console.error("Image generation stream error:", err)
          const errorJson = JSON.stringify({
            type: "error",
            error: "Image generation failed. Please try again.",
          })
          controller.enqueue(encoder.encode(errorJson + "\n"))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (err) {
    console.error("Image generation error:", err)
    return apiError("Image generation failed. Please try again.")
  }
}
