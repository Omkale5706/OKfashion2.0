import { PhotoUpload } from "@/components/ai/photo-upload"

interface UploadImageProps {
  onImageUpload: (imageUrl: string) => void
}

export default function UploadImage({ onImageUpload }: UploadImageProps) {
  return <PhotoUpload onImageUpload={onImageUpload} />
}
