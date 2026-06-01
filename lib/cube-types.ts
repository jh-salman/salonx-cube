export const CUBE_ID = "default";

export const FACE_LABELS = [
  "Right",
  "Left",
  "Top",
  "Bottom",
  "Front",
  "Back",
] as const;

export type FaceFit = "cover" | "contain" | "stretch";
export type FaceKind = "image" | "video";

export type CubeFaceDto = {
  kind: FaceKind;
  custom: boolean;
  src: string | null;
  zoom: number;
  panX: number;
  panY: number;
  fit: FaceFit;
  link: string;
};

export type CubeSettingsDto = {
  masterLinkOn: boolean;
  masterLink: string;
};

export type CubeDto = {
  id: string;
  name: string;
  faces: CubeFaceDto[];
  settings: CubeSettingsDto;
  updatedAt?: string;
};

export type MediaUploadResult = {
  id: string;
  url: string;
  mimeType: string;
  size: number;
  faceIndex?: number;
};
