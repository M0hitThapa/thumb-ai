import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { apiError, validationError } from "@/lib/api-error"
import { getVertexGenAI } from "@/lib/vertex-genai"

export const maxDuration = 30

const TEXT_MODEL = "google/gemini-3.1-pro-preview"

const Schema = z.object({
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return apiError("Unauthorized", 401)
    if (!checkRateLimit(session.user.id))
      return apiError("Rate limit exceeded.", 429)

    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) return validationError(parsed.error)

    const { title } = parsed.data

    const ai = getVertexGenAI()

    const prompt = `You help YouTube creators refine titles. The creator wrote:

"${title}"

Generate exactly **5 alternative title strings** that:
1. Reuse **most of the same words** as the creator's line — light edits only (word order, emphasis, add one number or question mark if it fits). Do NOT change the core story or invent a new angle.
2. Each variant under **75 characters** (reasonable for YouTube).
3. Honest — same subject matter as the original.

Return ONLY valid JSON: an array of 5 strings. No markdown.
Example format: ["...", "...", "...", "...", "..."]`

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    })

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

    const jsonStr = raw.replace(/```(?:json)?\n?/g, "").trim()

    let variants: string[]
    try {
      const parsed = JSON.parse(jsonStr) as unknown
      if (!Array.isArray(parsed)) throw new Error("not array")
      variants = (parsed as unknown[])
        .filter((v): v is string => typeof v === "string")
        .slice(0, 5)
      if (variants.length === 0) throw new Error("empty")
    } catch {
      const matches = jsonStr.match(/"([^"]+)"/g)
      variants = (matches ?? [])
        .map((s: string) => s.replace(/^"|"$/g, ""))
        .filter(Boolean)
        .slice(0, 5)
    }

    if (variants.length === 0) {
      return apiError("Could not generate title variants. Please try again.")
    }

    return NextResponse.json({ variants })
  } catch (err) {
    console.error("[generate-title-variants]", err)
    return apiError("Internal server error")
  }
}
