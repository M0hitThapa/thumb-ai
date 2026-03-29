import { NextResponse } from "next/server"

import z from "zod"

export function validationError(error: z.ZodError) {
  return NextResponse.json(
    {
      error: "Validation failed",
      details: error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    },
    { status: 400 }
  )
}

export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}
