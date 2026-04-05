# Cover Images

Put book cover images here and reference them in the database or seed file.

## For the seeded demo work  

If you have a cover for **"The Ashen Covenant"**, name it:

```
the-ashen-covenant.jpg
```

Then update the `coverImage` field in [prisma/seed.ts](../../prisma/seed.ts):

```ts
coverImage: '/covers/the-ashen-covenant.jpg',
```

And re-run `npm run db:seed`.

## Serving covers

Files in `public/covers/` are served at `/covers/<filename>` — no extra config needed.

## Recommendations

- **Dimensions:** 600×900 (2:3 portrait) or 800×1200
- **Formats:** `.jpg`, `.png`, or `.webp`
