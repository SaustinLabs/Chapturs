-- Living World System
-- Adds shared universe infrastructure: worlds, canon entries, characters,
-- contradiction flags, world council members, and votes.
-- Also adds nullable livingWorldId relation to the works table.

-- ── living_worlds ────────────────────────────────────────────────────────────
CREATE TABLE "living_worlds" (
  "id"           TEXT NOT NULL,
  "slug"         TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "theBeginning" TEXT,
  "theEnd"       TEXT,
  "coverImage"   TEXT,
  "status"       TEXT NOT NULL DEFAULT 'active',
  "founderId"    TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "living_worlds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "living_worlds_slug_key" ON "living_worlds"("slug");
CREATE INDEX "living_worlds_founderId_idx" ON "living_worlds"("founderId");

ALTER TABLE "living_worlds"
  ADD CONSTRAINT "living_worlds_founderId_fkey"
  FOREIGN KEY ("founderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── canon_entries ────────────────────────────────────────────────────────────
CREATE TABLE "canon_entries" (
  "id"              TEXT NOT NULL,
  "worldId"         TEXT NOT NULL,
  "entryType"       TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "content"         TEXT NOT NULL,
  "sourceWorkId"    TEXT,
  "sourceSectionId" TEXT,
  "status"          TEXT NOT NULL DEFAULT 'proposed',
  "createdById"     TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "canon_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "canon_entries_worldId_entryType_idx" ON "canon_entries"("worldId", "entryType");
CREATE INDEX "canon_entries_worldId_status_idx" ON "canon_entries"("worldId", "status");

ALTER TABLE "canon_entries"
  ADD CONSTRAINT "canon_entries_worldId_fkey"
  FOREIGN KEY ("worldId") REFERENCES "living_worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "canon_entries"
  ADD CONSTRAINT "canon_entries_sourceWorkId_fkey"
  FOREIGN KEY ("sourceWorkId") REFERENCES "works"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "canon_entries"
  ADD CONSTRAINT "canon_entries_sourceSectionId_fkey"
  FOREIGN KEY ("sourceSectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "canon_entries"
  ADD CONSTRAINT "canon_entries_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── canon_characters ─────────────────────────────────────────────────────────
CREATE TABLE "canon_characters" (
  "id"                       TEXT NOT NULL,
  "worldId"                  TEXT NOT NULL,
  "name"                     TEXT NOT NULL,
  "aliases"                  TEXT,
  "description"              TEXT,
  "traits"                   TEXT,
  "firstAppearanceWorkId"    TEXT,
  "firstAppearanceSectionId" TEXT,
  "status"                   TEXT NOT NULL DEFAULT 'active',
  "createdById"              TEXT NOT NULL,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL,

  CONSTRAINT "canon_characters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "canon_characters_worldId_name_key" ON "canon_characters"("worldId", "name");
CREATE INDEX "canon_characters_worldId_idx" ON "canon_characters"("worldId");

ALTER TABLE "canon_characters"
  ADD CONSTRAINT "canon_characters_worldId_fkey"
  FOREIGN KEY ("worldId") REFERENCES "living_worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "canon_characters"
  ADD CONSTRAINT "canon_characters_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── lore_contradiction_flags ─────────────────────────────────────────────────
CREATE TABLE "lore_contradiction_flags" (
  "id"              TEXT NOT NULL,
  "worldId"         TEXT NOT NULL,
  "canonEntryId"    TEXT,
  "description"     TEXT NOT NULL,
  "sourceWorkId"    TEXT,
  "sourceSectionId" TEXT,
  "status"          TEXT NOT NULL DEFAULT 'open',
  "resolvedById"    TEXT,
  "resolvedAt"      TIMESTAMP(3),
  "resolution"      TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "lore_contradiction_flags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lore_contradiction_flags_worldId_status_idx" ON "lore_contradiction_flags"("worldId", "status");

ALTER TABLE "lore_contradiction_flags"
  ADD CONSTRAINT "lore_contradiction_flags_worldId_fkey"
  FOREIGN KEY ("worldId") REFERENCES "living_worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lore_contradiction_flags"
  ADD CONSTRAINT "lore_contradiction_flags_canonEntryId_fkey"
  FOREIGN KEY ("canonEntryId") REFERENCES "canon_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lore_contradiction_flags"
  ADD CONSTRAINT "lore_contradiction_flags_sourceWorkId_fkey"
  FOREIGN KEY ("sourceWorkId") REFERENCES "works"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lore_contradiction_flags"
  ADD CONSTRAINT "lore_contradiction_flags_sourceSectionId_fkey"
  FOREIGN KEY ("sourceSectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lore_contradiction_flags"
  ADD CONSTRAINT "lore_contradiction_flags_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── world_council_members ────────────────────────────────────────────────────
CREATE TABLE "world_council_members" (
  "worldId"  TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  "role"     TEXT NOT NULL DEFAULT 'member',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "world_council_members_pkey" PRIMARY KEY ("worldId", "userId")
);

CREATE INDEX "world_council_members_userId_idx" ON "world_council_members"("userId");

ALTER TABLE "world_council_members"
  ADD CONSTRAINT "world_council_members_worldId_fkey"
  FOREIGN KEY ("worldId") REFERENCES "living_worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "world_council_members"
  ADD CONSTRAINT "world_council_members_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── world_council_votes ──────────────────────────────────────────────────────
CREATE TABLE "world_council_votes" (
  "id"         TEXT NOT NULL,
  "worldId"    TEXT NOT NULL,
  "voterId"    TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId"   TEXT NOT NULL,
  "vote"       TEXT NOT NULL DEFAULT 'approve',
  "comment"    TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "world_council_votes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "world_council_votes_worldId_voterId_targetType_targetId_key"
  ON "world_council_votes"("worldId", "voterId", "targetType", "targetId");
CREATE INDEX "world_council_votes_worldId_targetType_targetId_idx"
  ON "world_council_votes"("worldId", "targetType", "targetId");

ALTER TABLE "world_council_votes"
  ADD CONSTRAINT "world_council_votes_worldId_fkey"
  FOREIGN KEY ("worldId") REFERENCES "living_worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "world_council_votes"
  ADD CONSTRAINT "world_council_votes_voterId_fkey"
  FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── works — add livingWorldId ────────────────────────────────────────────────
ALTER TABLE "works" ADD COLUMN "livingWorldId" TEXT;

ALTER TABLE "works"
  ADD CONSTRAINT "works_livingWorldId_fkey"
  FOREIGN KEY ("livingWorldId") REFERENCES "living_worlds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "works_livingWorldId_idx" ON "works"("livingWorldId");
