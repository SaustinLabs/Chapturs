-- Extend payouts with request/process audit metadata
ALTER TABLE "payouts"
  ADD COLUMN "requestedById" TEXT,
  ADD COLUMN "requestedAt" TIMESTAMP(3),
  ADD COLUMN "processedById" TEXT,
  ADD COLUMN "failureReason" TEXT,
  ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "payouts_idempotencyKey_key" ON "payouts"("idempotencyKey");

CREATE INDEX "payouts_requestedById_idx" ON "payouts"("requestedById");
CREATE INDEX "payouts_processedById_idx" ON "payouts"("processedById");

ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payouts"
  ADD CONSTRAINT "payouts_processedById_fkey"
  FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
