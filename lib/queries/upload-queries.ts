import { useMutation } from "@tanstack/react-query"
import { uploadImage } from "@/lib/api"

/**
 * Mutation hook for uploading images
 */
export function useUploadImage() {
  return useMutation({
    mutationFn: ({ dataUrl, filename }: { dataUrl: string; filename?: string }) =>
      uploadImage(dataUrl, filename),
  })
}

