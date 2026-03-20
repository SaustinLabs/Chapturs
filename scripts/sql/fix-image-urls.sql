-- Fix R2 image URLs in database
-- Replace incorrect account ID with correct one

-- Update Work cover images
UPDATE "Work"
SET "coverImage" = REPLACE("coverImage", 'pub-bcdec06776b58a6802e2c3face0f004c.r2.dev', 'pub-505fbfcdba444803a75ae90dd308aa04.r2.dev')
WHERE "coverImage" LIKE '%pub-bcdec06776b58a6802e2c3face0f004c.r2.dev%';

-- Update User profile images
UPDATE "User"
SET "image" = REPLACE("image", 'pub-bcdec06776b58a6802e2c3face0f004c.r2.dev', 'pub-505fbfcdba444803a75ae90dd308aa04.r2.dev')
WHERE "image" LIKE '%pub-bcdec06776b58a6802e2c3face0f004c.r2.dev%';

-- Update User profile banners
UPDATE "User"
SET "profileBanner" = REPLACE("profileBanner", 'pub-bcdec06776b58a6802e2c3face0f004c.r2.dev', 'pub-505fbfcdba444803a75ae90dd308aa04.r2.dev')
WHERE "profileBanner" LIKE '%pub-bcdec06776b58a6802e2c3face0f004c.r2.dev%';

-- Update Character profile images
UPDATE "Character"
SET "profileImage" = REPLACE("profileImage", 'pub-bcdec06776b58a6802e2c3face0f004c.r2.dev', 'pub-505fbfcdba444803a75ae90dd308aa04.r2.dev')
WHERE "profileImage" LIKE '%pub-bcdec06776b58a6802e2c3face0f004c.r2.dev%';

-- Check how many rows will be affected
SELECT 
  'Work coverImage' as table_column,
  COUNT(*) as affected_rows
FROM "Work"
WHERE "coverImage" LIKE '%pub-bcdec06776b58a6802e2c3face0f004c.r2.dev%'

UNION ALL

SELECT 
  'User image' as table_column,
  COUNT(*) as affected_rows
FROM "User"
WHERE "image" LIKE '%pub-bcdec06776b58a6802e2c3face0f004c.r2.dev%'

UNION ALL

SELECT 
  'User profileBanner' as table_column,
  COUNT(*) as affected_rows
FROM "User"
WHERE "profileBanner" LIKE '%pub-bcdec06776b58a6802e2c3face0f004c.r2.dev%'

UNION ALL

SELECT 
  'Character profileImage' as table_column,
  COUNT(*) as affected_rows
FROM "Character"
WHERE "profileImage" LIKE '%pub-bcdec06776b58a6802e2c3face0f004c.r2.dev%';
