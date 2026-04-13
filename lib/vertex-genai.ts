import { GoogleGenAI } from "@google/genai"

let _vertexClient: GoogleGenAI | null = null

export function getVertexGenAI(): GoogleGenAI {
  if (!_vertexClient) {
    const project =
      process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
      process.env.GCP_PROJECT_ID?.trim()
    const location = process.env.GOOGLE_CLOUD_LOCATION?.trim() ?? "us-central1"

    if (!project) throw new Error("GOOGLE_CLOUD_PROJECT is not set")

    _vertexClient = new GoogleGenAI({
      vertexai: true,
      project,
      location,
      ...(process.env.GOOGLE_CLOUD_API_KEY
        ? { apiKey: process.env.GOOGLE_CLOUD_API_KEY }
        : {}),
    })
  }
  return _vertexClient
}
