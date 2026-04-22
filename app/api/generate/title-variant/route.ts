import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { apiError, validationError } from "@/lib/api-error"
import { getVertexGenAI } from "@/lib/vertex-genai"

export const maxDuration = 30

const TEXT_MODEL = "gemini-3.1-flash-lite-preview"

const bodySchema = z.object({
  title: z.string().min(3).max(500),
})


const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

const PROMPT = (title: string) => `You help YouTube creators refine titles.
The creator wrote: "${title}"

Return ONLY a JSON array of exactly 5 alternative titles. No markdown, no explanation.
Rules:
- Reuse most of the same words — light edits only (word order, emphasis, one number or "?" if it fits)
- Each title under 75 characters
- Same subject matter, no new angles

Example: ["...", "...", "...", "...", "..."]`

function parseVariants(raw: string): string[] {
  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      return (parsed as unknown[])
        .filter((v): v is string => typeof v === "string")
        .slice(0, 5)
    }
  } catch {}


  return (cleaned.match(/"([^"]+)"/g) ?? [])
    .map((s) => s.slice(1, -1))
    .filter(Boolean)
    .slice(0, 5)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return apiError("Unauthorized", 401)
  if (!checkRateLimit(session.user.id))
    return apiError("Rate limit exceeded.", 429)

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return validationError(parsed.error)

  try {
    const response = await getVertexGenAI().models.generateContent({
      model: TEXT_MODEL,
      contents: PROMPT(parsed.data.title),
    })

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const variants = parseVariants(raw)

    if (variants.length === 0)
      return apiError("Could not generate title variants. Please try again.")

    return NextResponse.json({ variants })
  } catch (err) {
    console.error("[generate-title-variants]", err)
    return apiError("Internal server error")
  }
}
