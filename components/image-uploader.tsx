import { useImagesStore } from "@/lib/store/image-store"
import { useRef } from "react"

export const ImageUploader = () => {
  const uploadImage = useImagesStore((s) => s.uploadedImages)
  const addImage = useImagesStore((s) => s.addImages)
  const removeImage = useImagesStore((s) => s.removeImage)

  const inputRef = useRef<HTMLInputElement>(null)
}
