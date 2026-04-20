-- Create stripe_event_logs table for webhook idempotency and audit visibility
CREATE TABLE "stripe_event_logs" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'running',
  "errorMessage" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_event_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stripe_event_logs_eventId_key" ON "stripe_event_logs"("eventId");
CREATE INDEX "stripe_event_logs_eventType_idx" ON "stripe_event_logs"("eventType");
CREATE INDEX "stripe_event_logs_status_idx" ON "stripe_event_logs"("status");
CREATE INDEX "stripe_event_logs_createdAt_idx" ON "stripe_event_logs"("createdAt");
