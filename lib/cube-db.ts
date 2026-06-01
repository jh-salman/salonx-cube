import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import {
  CUBE_ID,
  FACE_LABELS,
  type CubeDto,
  type CubeFaceDto,
  type CubeSettingsDto,
  type FaceFit,
  type FaceKind,
  type MediaUploadResult,
} from "@/lib/cube-types";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = getPrismaClient();
}

export { CUBE_ID };

const DEFAULT_SETTINGS: CubeSettingsDto = {
  masterLinkOn: false,
  masterLink: "",
};

function defaultFaceDto(): CubeFaceDto {
  return {
    kind: "image",
    custom: false,
    src: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    fit: "cover",
    link: "",
  };
}

function normalizeKind(value: unknown): FaceKind {
  return value === "video" ? "video" : "image";
}

function normalizeFit(value: unknown): FaceFit {
  if (value === "contain" || value === "stretch") return value;
  return "cover";
}

function normalizeFaceDto(input: unknown): CubeFaceDto {
  const face = (input ?? {}) as Partial<CubeFaceDto>;
  return {
    kind: normalizeKind(face.kind),
    custom: !!face.custom,
    src: typeof face.src === "string" ? face.src : null,
    zoom: typeof face.zoom === "number" ? face.zoom : 1,
    panX: typeof face.panX === "number" ? face.panX : 0,
    panY: typeof face.panY === "number" ? face.panY : 0,
    fit: normalizeFit(face.fit),
    link: typeof face.link === "string" ? face.link : "",
  };
}

export function normalizeCubePayload(input: unknown): {
  faces: CubeFaceDto[];
  settings: CubeSettingsDto;
  name?: string;
} {
  const data = (input ?? {}) as Partial<CubeDto>;
  const faces = Array.isArray(data.faces) ? data.faces : [];
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(data.settings ?? {}),
  };

  const normalizedFaces = Array.from({ length: 6 }, (_, index) => {
    const fromInput = faces[index];
    return normalizeFaceDto(fromInput);
  });

  return {
    name: typeof data.name === "string" ? data.name : undefined,
    faces: normalizedFaces,
    settings: {
      masterLinkOn: !!settings.masterLinkOn,
      masterLink:
        typeof settings.masterLink === "string" ? settings.masterLink : "",
    },
  };
}

function rowToFaceDto(
  row: {
    kind: string;
    fit: string;
    zoom: number;
    panX: number;
    panY: number;
    link: string;
    media: { id: string } | null;
  },
): CubeFaceDto {
  const hasMedia = !!row.media;
  return {
    kind: normalizeKind(row.kind),
    custom: hasMedia,
    src: hasMedia ? `/api/cube/media/${row.media!.id}` : null,
    zoom: row.zoom,
    panX: row.panX,
    panY: row.panY,
    fit: normalizeFit(row.fit),
    link: row.link,
  };
}

async function ensureCube() {
  const existing = await prisma.cube.findUnique({
    where: { id: CUBE_ID },
    include: { faces: true },
  });

  if (existing && existing.faces.length === 6) {
    return existing;
  }

  if (existing) {
    await prisma.cubeFace.deleteMany({ where: { cubeId: CUBE_ID } });
    await prisma.cube.delete({ where: { id: CUBE_ID } });
  }

  return prisma.cube.create({
    data: {
      id: CUBE_ID,
      name: "SALON X Cube",
      faces: {
        create: FACE_LABELS.map((label, faceIndex) => ({
          faceIndex,
          label,
          kind: "image",
          fit: "cover",
          zoom: 1,
          panX: 0,
          panY: 0,
          link: "",
        })),
      },
    },
    include: { faces: { include: { media: true }, orderBy: { faceIndex: "asc" } } },
  });
}

export async function getCubeState(): Promise<CubeDto> {
  await ensureCube();

  const cube = await prisma.cube.findUniqueOrThrow({
    where: { id: CUBE_ID },
    include: {
      faces: {
        orderBy: { faceIndex: "asc" },
        include: { media: true },
      },
    },
  });

  const faces = Array.from({ length: 6 }, (_, index) => {
    const row = cube.faces.find((f) => f.faceIndex === index);
    return row ? rowToFaceDto(row) : defaultFaceDto();
  });

  return {
    id: cube.id,
    name: cube.name,
    faces,
    settings: {
      masterLinkOn: cube.masterLinkOn,
      masterLink: cube.masterLink,
    },
    updatedAt: cube.updatedAt.toISOString(),
  };
}

export async function saveCubeState(payload: unknown): Promise<CubeDto> {
  const { faces, settings, name } = normalizeCubePayload(payload);
  await ensureCube();

  await prisma.$transaction(async (tx) => {
    await tx.cube.update({
      where: { id: CUBE_ID },
      data: {
        ...(name ? { name } : {}),
        masterLinkOn: settings.masterLinkOn,
        masterLink: settings.masterLink,
      },
    });

    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
      const face = faces[faceIndex];
      const existing = await tx.cubeFace.findUnique({
        where: { cubeId_faceIndex: { cubeId: CUBE_ID, faceIndex } },
        include: { media: true },
      });

      if (!existing) continue;

      let mediaId = existing.mediaId;

      if (!face.custom || !face.src) {
        if (mediaId) {
          await tx.cubeMedia.delete({ where: { id: mediaId } }).catch(() => {});
          mediaId = null;
        }
      } else if (face.src.startsWith("/api/cube/media/")) {
        const id = face.src.split("/").pop();
        if (id) mediaId = id;
      }

      await tx.cubeFace.update({
        where: { id: existing.id },
        data: {
          kind: face.kind,
          fit: face.fit,
          zoom: face.zoom,
          panX: face.panX,
          panY: face.panY,
          link: face.link,
          mediaId,
        },
      });
    }
  });

  return getCubeState();
}

export async function updateCubeFace(
  faceIndex: number,
  patch: Partial<CubeFaceDto>,
): Promise<CubeDto> {
  if (faceIndex < 0 || faceIndex > 5) {
    throw new Error("faceIndex must be 0–5");
  }

  await ensureCube();
  const current = await getCubeState();
  const faces = [...current.faces];
  faces[faceIndex] = { ...faces[faceIndex], ...normalizeFaceDto(patch) };

  return saveCubeState({
    faces,
    settings: current.settings,
    name: current.name,
  });
}

export async function uploadCubeMedia(
  file: File,
  faceIndex?: number,
): Promise<MediaUploadResult> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    throw new Error("Only image or video uploads are allowed");
  }

  const maxBytes = isVideo ? 30 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)`,
    );
  }

  const data = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || (isVideo ? "video/mp4" : "image/jpeg");

  await ensureCube();

  const media = await prisma.$transaction(async (tx) => {
    if (faceIndex !== undefined && faceIndex >= 0 && faceIndex <= 5) {
      const face = await tx.cubeFace.findUnique({
        where: { cubeId_faceIndex: { cubeId: CUBE_ID, faceIndex } },
      });

      if (face?.mediaId) {
        await tx.cubeMedia.delete({ where: { id: face.mediaId } }).catch(() => {});
      }
    }

    const created = await tx.cubeMedia.create({
      data: { mimeType, data, size: data.length },
    });

    if (faceIndex !== undefined && faceIndex >= 0 && faceIndex <= 5) {
      await tx.cubeFace.update({
        where: { cubeId_faceIndex: { cubeId: CUBE_ID, faceIndex } },
        data: {
          mediaId: created.id,
          kind: isVideo ? "video" : "image",
          custom: true,
        },
      });
    }

    return created;
  });

  return {
    id: media.id,
    url: `/api/cube/media/${media.id}`,
    mimeType: media.mimeType,
    size: media.size,
    faceIndex,
  };
}

export async function persistFacesWithUploads(
  faces: CubeFaceDto[],
  settings: CubeSettingsDto,
): Promise<CubeDto> {
  const resolved = await Promise.all(
    faces.map(async (face, index) => {
      if (
        !face.custom ||
        !face.src ||
        (!face.src.startsWith("blob:") && !face.src.startsWith("data:"))
      ) {
        return face;
      }

      const blob = await fetch(face.src).then((r) => r.blob());
      const file = new File(
        [blob],
        `face-${index}${face.kind === "video" ? ".mp4" : ".jpg"}`,
        {
          type:
            blob.type ||
            (face.kind === "video" ? "video/mp4" : "image/jpeg"),
        },
      );

      const uploaded = await uploadCubeMedia(file, index);
      return {
        ...face,
        custom: true,
        src: uploaded.url,
        kind: face.kind,
      };
    }),
  );

  return saveCubeState({ faces: resolved, settings });
}
