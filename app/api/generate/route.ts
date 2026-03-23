import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
  } catch {}
}
