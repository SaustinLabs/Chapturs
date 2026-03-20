-- DIAGNOSTIC SQL QUERIES FOR CREATOR WORKS ISSUE
-- Run these in Supabase SQL Editor to find where your works are

-- Your known user ID from logs: 92ae93c9-4632-489d-a9e7-83581a9624f7
-- Your known author ID from logs: cmgoodf8b0001l404mujuczjv

-- ==========================================
-- QUERY 1: Check your user record
-- ==========================================
SELECT 
    id,
    email,
    username,
    "displayName",
    "createdAt"
FROM users
WHERE id = '92ae93c9-4632-489d-a9e7-83581a9624f7';


-- ==========================================
-- QUERY 2: Check your author record
-- ==========================================
SELECT 
    id,
    "userId",
    verified,
    "createdAt"
FROM authors
WHERE "userId" = '92ae93c9-4632-489d-a9e7-83581a9624f7';


-- ==========================================
-- QUERY 3: Check works linked to YOUR author
-- ==========================================
SELECT 
    id,
    title,
    "authorId",
    status,
    "formatType",
    "createdAt"
FROM works
WHERE "authorId" = 'cmgoodf8b0001l404mujuczjv'
ORDER BY "createdAt" DESC;


-- ==========================================
-- QUERY 4: Check ALL works in database (recent 20)
-- ==========================================
SELECT 
    w.id as work_id,
    w.title,
    w."authorId",
    w.status,
    w."createdAt",
    a."userId" as author_user_id,
    u.email as author_email
FROM works w
LEFT JOIN authors a ON w."authorId" = a.id
LEFT JOIN users u ON a."userId" = u.id
ORDER BY w."createdAt" DESC
LIMIT 20;


-- ==========================================
-- QUERY 5: Find orphaned works (no author)
-- ==========================================
SELECT 
    id,
    title,
    "authorId",
    status,
    "createdAt"
FROM works
WHERE "authorId" IS NULL
   OR "authorId" NOT IN (SELECT id FROM authors);


-- ==========================================
-- QUERY 6: Find works with your email (if created under different user)
-- ==========================================
SELECT 
    w.id as work_id,
    w.title,
    w."authorId",
    w.status,
    a."userId" as author_user_id,
    a.id as author_id,
    u.email
FROM works w
LEFT JOIN authors a ON w."authorId" = a.id  
LEFT JOIN users u ON a."userId" = u.id
WHERE u.email = 'smccrary94@gmail.com'
ORDER BY w."createdAt" DESC;


-- ==========================================
-- QUERY 7: Count works per author
-- ==========================================
SELECT 
    a.id as author_id,
    a."userId",
    u.email,
    COUNT(w.id) as work_count
FROM authors a
LEFT JOIN users u ON a."userId" = u.id
LEFT JOIN works w ON w."authorId" = a.id
GROUP BY a.id, a."userId", u.email
HAVING COUNT(w.id) > 0
ORDER BY work_count DESC;


-- ==========================================
-- QUERY 8: Check if there are multiple user accounts with your email
-- ==========================================
SELECT 
    id,
    email,
    username,
    "createdAt"
FROM users
WHERE email = 'smccrary94@gmail.com'
ORDER BY "createdAt";


-- ==========================================
-- EXPECTED RESULTS:
-- ==========================================
-- - Query 3 should show your works (currently showing 0)
-- - Query 4 will show if ANY works exist
-- - Query 6 will show if works exist under your email but different user ID
-- - Query 8 will show if you have duplicate accounts

-- ==========================================
-- IF WORKS ARE FOUND UNDER DIFFERENT AUTHOR:
-- ==========================================
-- Use this to migrate them (REPLACE THE IDS):
/*
UPDATE works
SET "authorId" = 'cmgoodf8b0001l404mujuczjv'
WHERE "authorId" = 'OLD_AUTHOR_ID_HERE';
*/
