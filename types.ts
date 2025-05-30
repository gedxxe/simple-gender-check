
export type GenderResult = "Male" | "Female" | "Indeterminate" | "NoFaceDetected" | "Error" | null;

export interface ImageData {
  base64: string;
  mimeType: string;
  name?: string;
}
