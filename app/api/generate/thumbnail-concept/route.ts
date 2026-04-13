import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { generateThumbnailConcepts } from "@/lib/thumbnail"
import { apiError, validationError } from "@/lib/api-error"

export const maxDuration = 60

const GenerateSchema = z.object({
  title: z.string().min(3).max(500),
  style: z.string().max(200).optional(),
  colorTheme: z.string().max(200).optional(),
})

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return apiError("Unauthorized", 401)
    if (!checkRateLimit(session.user.id))
      return apiError("Rate limit exceeded. Max 5 per minute.", 429)

    const parsed = GenerateSchema.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { title, style, colorTheme } = parsed.data

    let result
    try {
      result = await generateThumbnailConcepts({
        title,
        style,
        colorTheme,
        userId: session.user.id,
      })
    } catch (err) {
      console.error("Concept generation error:", err)
      return apiError("AI generation failed. Please try again.")
    }

    try {
      await prisma.thumbnail.create({
        data: {
          userId: session.user.id,
          prompt: title,
          imageUrl: "",
          ctrScore: result.concepts[0]?.ctrScore ?? null,
          title: title.slice(0, 100),
          style: style ?? null,
          colorTheme: colorTheme ?? null,
          metadata: result as unknown as Prisma.InputJsonValue,
        },
      })
    } catch (dbErr) {
      console.warn(
        "Could not save to library (run `prisma db push` to create the thumbnails table):",
        dbErr
      )
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Generate route error:", error)
    return apiError("Internal server error")
  }
}
