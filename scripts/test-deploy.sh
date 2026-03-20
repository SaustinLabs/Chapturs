#!/bin/bash

echo "�� Testing Vercel Auto-Deploy..."
echo ""
echo "Creating test commit..."
git commit --allow-empty -m "test: Verify auto-deploy is working"

echo ""
echo "Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Push complete!"
echo ""
echo "Now check your Vercel dashboard:"
echo "👉 https://vercel.com/dashboard"
echo ""
echo "You should see a new deployment appear within 10 seconds."
echo "If you don't see it, auto-deploy is still broken."
echo ""
echo "Fix: Go to Settings → Git → Disconnect & Reconnect repository"
