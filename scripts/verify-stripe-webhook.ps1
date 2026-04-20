param(
  [string]$WebhookUrl = "http://localhost:3000/api/stripe/webhook"
)

$ErrorActionPreference = 'Stop'

Write-Host "[verify-stripe-webhook] Starting verification..." -ForegroundColor Cyan
Write-Host "Target webhook: $WebhookUrl"

if (-not (Get-Command stripe -ErrorAction SilentlyContinue)) {
  Write-Error "Stripe CLI not found. Install from https://stripe.com/docs/stripe-cli and run 'stripe login'."
}

Write-Host "1) Ensure your local app is running (npm run dev)." -ForegroundColor Yellow
Write-Host "2) Starting Stripe webhook forwarder in a new terminal..." -ForegroundColor Yellow

$forwardCmd = "stripe listen --forward-to $WebhookUrl"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $forwardCmd | Out-Null

Write-Host "3) Waiting briefly for Stripe listener startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

Write-Host "4) Triggering test events..." -ForegroundColor Yellow
stripe trigger checkout.session.completed | Out-Null
stripe trigger customer.subscription.updated | Out-Null
stripe trigger invoice.payment_failed | Out-Null

Write-Host "Verification events dispatched." -ForegroundColor Green
Write-Host "Now validate results via admin endpoint (while authenticated as admin):" -ForegroundColor Cyan
Write-Host "GET /api/admin/stripe/events?limit=20"
Write-Host "Expected statuses: completed for each event, no duplicate processing for replayed event IDs." -ForegroundColor Cyan
