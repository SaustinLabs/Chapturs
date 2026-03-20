# Image Upload - Quick Implementation Checklist

## Phase 1: Basic Setup (Day 1)

### Cloudflare R2 Setup
- [ ] Create Cloudflare R2 bucket (`chapturs-images`)
- [ ] Generate API tokens (Access Key ID + Secret)
- [ ] Copy Account ID
- [ ] Add environment variables to `.env.local`
- [ ] Add environment variables to Vercel/production
- [ ] (Optional) Set up custom domain (`images.chapturs.com`)

### Dependencies
- [ ] Install packages: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp uuid`
- [ ] Test installation: `npm run build`

### Database
- [ ] Add Image model to `prisma/schema.prisma`
- [ ] Run migration: `npx prisma migrate dev --name add_image_model`
- [ ] Generate Prisma client: `npx prisma generate`

## Phase 2: Core Infrastructure (Day 1-2)

### Utilities
- [ ] Create `src/lib/r2.ts` (R2 client and helpers)
- [ ] Create `src/lib/image-processing.ts` (image optimization)
- [ ] Create `src/lib/upload-validation.ts` (file validation)
- [ ] Test R2 connection with simple upload

### API Routes
- [ ] Create `/api/upload/request/route.ts` (presigned URL)
- [ ] Create `/api/upload/confirm/route.ts` (save metadata)
- [ ] Create `/api/upload/delete/route.ts` (delete images)
- [ ] Test API routes with Postman/Thunder Client

## Phase 3: UI Component (Day 2-3)

### Upload Component
- [ ] Create `src/components/ImageUpload.tsx`
- [ ] Add file selection
- [ ] Add upload progress
- [ ] Add preview
- [ ] Add delete functionality
- [ ] Add error handling
- [ ] Style component

### Test Upload Component
- [ ] Create test page: `src/app/test-upload/page.tsx`
- [ ] Test file selection
- [ ] Test upload flow
- [ ] Test progress indication
- [ ] Test error states
- [ ] Test delete

## Phase 4: Integration (Day 3-4)

### Profile Images
- [ ] Update `BasicInfoEditor.tsx` to use ImageUpload
- [ ] Add profile picture upload
- [ ] Add cover image upload
- [ ] Test profile image upload
- [ ] Update profile API to save image URLs

### Book Covers
- [ ] Update work/book editor to use ImageUpload
- [ ] Add cover image upload
- [ ] Test book cover upload
- [ ] Update work API to save cover URLs

### Fan Art (if implemented)
- [ ] Add ImageUpload to fan art submission form
- [ ] Test fan art upload
- [ ] Update fan art API

## Phase 5: Advanced Features (Day 4-5)

### Image Variants (Optional)
- [ ] Add variant generation to confirm endpoint
- [ ] Test responsive images
- [ ] Update Image model to store variants
- [ ] Use srcset for responsive loading

### Content Moderation
- [ ] Set up Claude API key
- [ ] Create `src/lib/image-moderation.ts`
- [ ] Add moderation to confirm endpoint
- [ ] Test with safe/unsafe images
- [ ] Create moderation queue/dashboard

### Rate Limiting
- [ ] Set up Upstash Redis (optional)
- [ ] Create `src/lib/rate-limit.ts`
- [ ] Add rate limiting to upload request
- [ ] Test rate limit enforcement

## Phase 6: Polish & Testing (Day 5-6)

### Error Handling
- [ ] Add comprehensive error messages
- [ ] Add retry logic for failed uploads
- [ ] Add cleanup for partial uploads
- [ ] Test error scenarios

### Performance
- [ ] Add image compression before upload
- [ ] Optimize preview generation
- [ ] Add loading states
- [ ] Test with large files
- [ ] Test with slow connections

### Security
- [ ] Verify file type validation
- [ ] Test file size limits
- [ ] Check authentication on all endpoints
- [ ] Test CORS configuration
- [ ] Audit permissions

## Phase 7: Production (Day 6-7)

### Deployment
- [ ] Deploy to staging environment
- [ ] Test all upload flows in staging
- [ ] Monitor R2 usage and costs
- [ ] Set up error logging/monitoring
- [ ] Deploy to production

### Documentation
- [ ] Document upload limits for users
- [ ] Create user guide for image uploads
- [ ] Document API endpoints
- [ ] Create troubleshooting guide

### Monitoring
- [ ] Set up analytics for uploads
- [ ] Monitor R2 storage usage
- [ ] Track upload success/failure rates
- [ ] Set up alerts for errors

## Quick Start Commands

```bash
# 1. Install dependencies
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp uuid

# 2. Update database
npx prisma migrate dev --name add_image_model
npx prisma generate

# 3. Test build
npm run build

# 4. Run dev server
npm run dev

# 5. Test upload at
http://localhost:3000/test-upload
```

## Environment Variables Template

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=chapturs-images
R2_PUBLIC_URL=https://images.chapturs.com

# Upload Settings
MAX_IMAGE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif

# Optional: Content Moderation
ANTHROPIC_API_KEY=your_claude_key

# Optional: Rate Limiting
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Testing Checklist

### Basic Upload
- [ ] Upload JPEG image
- [ ] Upload PNG image
- [ ] Upload WebP image
- [ ] Upload GIF image
- [ ] Upload oversized file (should fail)
- [ ] Upload non-image file (should fail)
- [ ] Upload with slow internet
- [ ] Upload multiple files in sequence

### Integration
- [ ] Upload profile picture
- [ ] Upload cover image
- [ ] Upload book cover
- [ ] Delete uploaded image
- [ ] Replace existing image
- [ ] Cancel mid-upload

### Edge Cases
- [ ] Upload with no internet (offline)
- [ ] Upload when API is down
- [ ] Upload when R2 is down
- [ ] Upload duplicate file
- [ ] Upload very small file (1KB)
- [ ] Upload at max size limit
- [ ] Upload with special characters in filename
- [ ] Upload from mobile device

## Common Issues & Solutions

### "Failed to generate upload URL"
- Check environment variables are set
- Verify R2 credentials are correct
- Check R2 bucket exists

### "Failed to upload file"
- Check CORS configuration on R2
- Verify presigned URL hasn't expired
- Check file size limits

### "Failed to confirm upload"
- Check database connection
- Verify Image model exists
- Check user authentication

### Images not displaying
- Check R2 bucket is public or domain is configured
- Verify public URL is correct
- Check CORS headers

### Rate limit errors
- Check Upstash Redis is configured
- Adjust rate limit thresholds
- Implement user feedback

## Performance Targets

- [ ] Upload time < 5 seconds for 5MB image
- [ ] Preview generation < 500ms
- [ ] API response time < 200ms
- [ ] Image loading < 1 second (with CDN)
- [ ] Compression ratio > 50% for large images

## Success Criteria

✅ Users can upload images < 10MB  
✅ Upload progress is visible  
✅ Previews work correctly  
✅ Images are stored in R2  
✅ Images load from CDN  
✅ Delete functionality works  
✅ Validation prevents bad uploads  
✅ Rate limiting prevents abuse  
✅ Content moderation flags unsafe images  
✅ No TypeScript errors  
✅ Mobile-friendly upload experience  

## Estimated Timeline

- **Basic Setup**: 1 day
- **Core Infrastructure**: 1 day
- **UI Component**: 1 day
- **Integration**: 1 day
- **Advanced Features**: 1 day
- **Testing & Polish**: 1 day
- **Production Deploy**: 1 day

**Total**: ~1 week for full implementation

## Next Steps After Completion

1. Monitor upload metrics
2. Gather user feedback
3. Optimize based on usage patterns
4. Add more entity types (comments, messages, etc.)
5. Implement image gallery/lightbox
6. Add image editing tools (crop, rotate)
7. Enable drag-and-drop upload
8. Add bulk upload capability

---

Start with Phase 1 and work through systematically. Test each phase before moving to the next!
