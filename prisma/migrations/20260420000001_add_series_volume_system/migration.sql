-- Migration: add_series_volume_system
-- Adds Series, SeriesVolume, and SeriesWork models to support
-- grouping works into multi-volume series with ordered memberships.

-- Create series table
CREATE TABLE "series" (
    "id"          TEXT NOT NULL,
    "authorId"    TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "coverImage"  TEXT,
    "status"      TEXT NOT NULL DEFAULT 'ongoing',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- Create series_volumes table
CREATE TABLE "series_volumes" (
    "id"          TEXT NOT NULL,
    "seriesId"    TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "orderIndex"  INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_volumes_pkey" PRIMARY KEY ("id")
);

-- Create series_works join table
CREATE TABLE "series_works" (
    "id"         TEXT NOT NULL,
    "seriesId"   TEXT NOT NULL,
    "workId"     TEXT NOT NULL,
    "volumeId"   TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "series_works_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: a work can only appear in a series once
CREATE UNIQUE INDEX "series_works_seriesId_workId_key" ON "series_works"("seriesId", "workId");

-- Indexes for common query patterns
CREATE INDEX "series_authorId_idx"             ON "series"("authorId");
CREATE INDEX "series_volumes_seriesId_order_idx" ON "series_volumes"("seriesId", "orderIndex");
CREATE INDEX "series_works_seriesId_order_idx"  ON "series_works"("seriesId", "orderIndex");
CREATE INDEX "series_works_workId_idx"          ON "series_works"("workId");

-- Foreign keys
ALTER TABLE "series"        ADD CONSTRAINT "series_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "series_volumes" ADD CONSTRAINT "series_volumes_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "series_works"   ADD CONSTRAINT "series_works_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "series_works"   ADD CONSTRAINT "series_works_workId_fkey"
    FOREIGN KEY ("workId") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "series_works"   ADD CONSTRAINT "series_works_volumeId_fkey"
    FOREIGN KEY ("volumeId") REFERENCES "series_volumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
