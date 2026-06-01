import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

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
  globalForPrisma.prisma = prisma;
}

export const CUBE_STATE_ID = "default";

export type CubeFace = {
  kind: "image" | "video";
  custom: boolean;
  src: string | null;
  zoom: number;
  panX: number;
  panY: number;
  fit: "cover" | "contain" | "stretch";
  link: string;
};

export type CubeSettings = {
  masterLinkOn: boolean;
  masterLink: string;
};

export type CubePayload = {
  faces: CubeFace[];
  settings: CubeSettings;
};

const DEFAULT_SETTINGS: CubeSettings = {
  masterLinkOn: false,
  masterLink: "",
};

const DEFAULT_FACE: Omit<CubeFace, "link"> = {
  kind: "image",
  custom: false,
  src: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  fit: "cover",
};

export function defaultFaces(): CubeFace[] {
  return Array.from({ length: 6 }, () => ({
    ...DEFAULT_FACE,
    link: "",
  }));
}

export function normalizeCubePayload(input: unknown): CubePayload {
  const data = (input ?? {}) as Partial<CubePayload>;
  const faces = Array.isArray(data.faces) ? data.faces : defaultFaces();
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(data.settings ?? {}),
  };

  return {
    faces: faces.slice(0, 6).map((face) => ({
      kind: face?.kind === "video" ? "video" : "image",
      custom: !!face?.custom,
      src: typeof face?.src === "string" ? face.src : null,
      zoom: typeof face?.zoom === "number" ? face.zoom : 1,
      panX: typeof face?.panX === "number" ? face.panX : 0,
      panY: typeof face?.panY === "number" ? face.panY : 0,
      fit:
        face?.fit === "contain" || face?.fit === "stretch"
          ? face.fit
          : "cover",
      link: typeof face?.link === "string" ? face.link : "",
    })),
    settings: {
      masterLinkOn: !!settings.masterLinkOn,
      masterLink:
        typeof settings.masterLink === "string" ? settings.masterLink : "",
    },
  };
}

export async function getCubeState(): Promise<CubePayload> {
  const row = await prisma.cubeState.findUnique({
    where: { id: CUBE_STATE_ID },
  });

  if (!row) {
    return { faces: defaultFaces(), settings: DEFAULT_SETTINGS };
  }

  return normalizeCubePayload({
    faces: row.faces,
    settings: row.settings,
  });
}

export async function saveCubeState(payload: unknown): Promise<CubePayload> {
  const normalized = normalizeCubePayload(payload);

  await prisma.cubeState.upsert({
    where: { id: CUBE_STATE_ID },
    create: {
      id: CUBE_STATE_ID,
      faces: normalized.faces,
      settings: normalized.settings,
    },
    update: {
      faces: normalized.faces,
      settings: normalized.settings,
    },
  });

  return normalized;
}
