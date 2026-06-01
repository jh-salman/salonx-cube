-- Reset legacy / partial schema (safe for local dev)
DROP TABLE IF EXISTS "CubeFace" CASCADE;
DROP TABLE IF EXISTS "CubeState" CASCADE;
DROP TABLE IF EXISTS "CubeLead" CASCADE;
DROP TABLE IF EXISTS "CubeMedia" CASCADE;
DROP TABLE IF EXISTS "Cube" CASCADE;

-- Cube root
CREATE TABLE "Cube" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'SALON X Cube',
    "masterLinkOn" BOOLEAN NOT NULL DEFAULT false,
    "masterLink" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cube_pkey" PRIMARY KEY ("id")
);

-- Media (created before faces for FK)
CREATE TABLE "CubeMedia" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CubeMedia_pkey" PRIMARY KEY ("id")
);

-- Six faces per cube
CREATE TABLE "CubeFace" (
    "id" TEXT NOT NULL,
    "cubeId" TEXT NOT NULL,
    "faceIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'image',
    "fit" TEXT NOT NULL DEFAULT 'cover',
    "zoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "panX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "panY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "link" TEXT NOT NULL DEFAULT '',
    "mediaId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CubeFace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CubeLead" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CubeLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CubeFace_cubeId_faceIndex_key" ON "CubeFace"("cubeId", "faceIndex");
CREATE UNIQUE INDEX "CubeFace_mediaId_key" ON "CubeFace"("mediaId");
CREATE INDEX "CubeFace_cubeId_idx" ON "CubeFace"("cubeId");
CREATE UNIQUE INDEX "CubeLead_phone_key" ON "CubeLead"("phone");

ALTER TABLE "CubeFace" ADD CONSTRAINT "CubeFace_cubeId_fkey" FOREIGN KEY ("cubeId") REFERENCES "Cube"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CubeFace" ADD CONSTRAINT "CubeFace_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "CubeMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default cube + 6 faces
INSERT INTO "Cube" ("id", "name", "masterLinkOn", "masterLink", "updatedAt")
VALUES ('default', 'SALON X Cube', false, '', CURRENT_TIMESTAMP);

INSERT INTO "CubeFace" ("id", "cubeId", "faceIndex", "label", "kind", "fit", "zoom", "panX", "panY", "link", "updatedAt", "createdAt")
VALUES
  ('face_0', 'default', 0, 'Right', 'image', 'cover', 1, 0, 0, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('face_1', 'default', 1, 'Left', 'image', 'cover', 1, 0, 0, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('face_2', 'default', 2, 'Top', 'image', 'cover', 1, 0, 0, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('face_3', 'default', 3, 'Bottom', 'image', 'cover', 1, 0, 0, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('face_4', 'default', 4, 'Front', 'image', 'cover', 1, 0, 0, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('face_5', 'default', 5, 'Back', 'image', 'cover', 1, 0, 0, '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
