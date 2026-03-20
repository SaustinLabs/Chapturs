-- Create the authenticated user record
INSERT OR REPLACE INTO users (id, email, username, displayName, avatar, verified, createdAt, updatedAt)
VALUES (
  '17d7ee5b-5e41-4e55-b5a7-3146d183098d',
  'smccrary94@gmail.com',
  'smccrary94',
  'Sam',
  null,
  false,
  datetime('now'),
  datetime('now')
);

-- Check if the user was created
SELECT * FROM users WHERE id = '17d7ee5b-5e41-4e55-b5a7-3146d183098d';
