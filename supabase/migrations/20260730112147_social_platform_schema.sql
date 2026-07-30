/*
# Social platform — profiles, feed posts, comments, likes, conversations, messages

## Overview
Extends the Office Management System with a full social layer so members can
maintain rich profiles (cover photo, avatar, bio, skills, resume link, role,
group/department), publish posts to a shared feed (with images, likes and
comments), and chat 1:1 via conversations and messages.

Single-tenant, no-auth app. All policies TO anon, authenticated with
USING (true) / WITH CHECK (true) — intentionally shared/public.

## 1. New Tables
- profiles (1:1 employees): cover_url, bio, location, timezone, website,
  linkedin_url, github_url, skills text[], resume_url, role, updated_at.
- posts: author_id FK employees, content, image_url, visibility, created_at.
- post_likes: post_id FK, employee_id FK, unique (post_id, employee_id).
- post_comments: post_id FK CASCADE, author_id FK, content, created_at.
- conversations: id, created_at.
- conversation_members: conversation_id FK CASCADE, employee_id FK,
  last_read_at, unique (conversation_id, employee_id).
- messages: conversation_id FK CASCADE, sender_id FK, content, created_at.

## 2. Security
- RLS on all new tables; 4 CRUD policies each (TO anon, authenticated).

## 3. Seed
- One profile per employee. Sample posts, likes, comments, 2 conversations.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  cover_url text,
  bio text,
  location text,
  timezone text DEFAULT 'PST (UTC-8)',
  website text,
  linkedin_url text,
  github_url text,
  skills text[] DEFAULT '{}',
  resume_url text,
  role text DEFAULT 'member',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','internal')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_posts" ON posts;
CREATE POLICY "anon_select_posts" ON posts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_posts" ON posts;
CREATE POLICY "anon_insert_posts" ON posts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_posts" ON posts;
CREATE POLICY "anon_update_posts" ON posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_posts" ON posts;
CREATE POLICY "anon_delete_posts" ON posts FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, employee_id)
);
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_post_likes" ON post_likes;
CREATE POLICY "anon_select_post_likes" ON post_likes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_post_likes" ON post_likes;
CREATE POLICY "anon_insert_post_likes" ON post_likes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_post_likes" ON post_likes;
CREATE POLICY "anon_delete_post_likes" ON post_likes FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_post_comments" ON post_comments;
CREATE POLICY "anon_select_post_comments" ON post_comments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_post_comments" ON post_comments;
CREATE POLICY "anon_insert_post_comments" ON post_comments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_post_comments" ON post_comments;
CREATE POLICY "anon_delete_post_comments" ON post_comments FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "anon_select_conversations" ON conversations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
CREATE POLICY "anon_delete_conversations" ON conversations FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  last_read_at timestamptz DEFAULT now(),
  UNIQUE (conversation_id, employee_id)
);
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_conversation_members" ON conversation_members;
CREATE POLICY "anon_select_conversation_members" ON conversation_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_conversation_members" ON conversation_members;
CREATE POLICY "anon_insert_conversation_members" ON conversation_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_conversation_members" ON conversation_members;
CREATE POLICY "anon_update_conversation_members" ON conversation_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_conversation_members" ON conversation_members;
CREATE POLICY "anon_delete_conversation_members" ON conversation_members FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post ON post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_emp ON conversation_members (employee_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conversation_id, created_at);

-- Seed profiles (one per employee)
INSERT INTO profiles (employee_id, cover_url, bio, location, skills, resume_url, role)
SELECT
  e.id,
  'https://images.pexels.com/photos/' ||
  CASE (abs(hashtext(e.id::text)) % 5)
    WHEN 0 THEN '1670989/pexels-photo-1670989.jpeg?auto=compress&cs=tinysrgb&w=1200'
    WHEN 1 THEN '3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=1200'
    WHEN 2 THEN '1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&w=1200'
    WHEN 3 THEN '255379/pexels-photo-255379.jpeg?auto=compress&cs=tinysrgb&w=1200'
    ELSE   '2425567/pexels-photo-2425567.jpeg?auto=compress&cs=tinysrgb&w=1200'
  END,
  CASE
    WHEN e.position ILIKE '%engineer%'  THEN 'Building reliable systems and clean interfaces. Passionate about DX and performance.'
    WHEN e.position ILIKE '%lead%'      THEN 'Leading the engineering team to ship great products. Coffee-powered.'
    WHEN e.position ILIKE '%manager%'   THEN 'Keeping people first — hiring, culture and growth are my north stars.'
    WHEN e.position ILIKE '%design%'    THEN 'Designing thoughtful, accessible experiences. Pixel perfectionist and prototyper.'
    WHEN e.position ILIKE '%sales%'     THEN 'Connecting customers with value. Always learning a new market.'
    WHEN e.position ILIKE '%analyst%'   THEN 'Turning numbers into decisions. Spreadsheets, dashboards, forecasts.'
    WHEN e.position ILIKE '%devops%'    THEN 'Keeping the pipeline green and deploys boring. Infrastructure as code.'
    WHEN e.position ILIKE '%strategist%' THEN 'Words that move people. Story-first content and brand voice.'
    ELSE 'Proud member of the Atlas team.'
  END,
  'San Francisco, CA',
  CASE
    WHEN e.position ILIKE '%engineer%'  THEN ARRAY['TypeScript','React','Node.js','PostgreSQL','Docker']
    WHEN e.position ILIKE '%lead%'      THEN ARRAY['Architecture','Leadership','Go','Kubernetes']
    WHEN e.position ILIKE '%manager%'   THEN ARRAY['Recruiting','Culture','Onboarding','People Ops']
    WHEN e.position ILIKE '%design%'    THEN ARRAY['Figma','Prototyping','Accessibility','Design Systems']
    WHEN e.position ILIKE '%sales%'     THEN ARRAY['Pipeline','Negotiation','CRM','Account Management']
    WHEN e.position ILIKE '%analyst%'   THEN ARRAY['Excel','SQL','Forecasting','Power BI']
    WHEN e.position ILIKE '%devops%'    THEN ARRAY['Docker','Kubernetes','Terraform','CI/CD','Grafana']
    WHEN e.position ILIKE '%strategist%' THEN ARRAY['Copywriting','SEO','Content Strategy','Brand']
    ELSE ARRAY['Collaboration','Communication']
  END,
  NULL,
  e.role
FROM employees e
ON CONFLICT (employee_id) DO NOTHING;

-- Seed posts (insert only if authors exist; idempotent via content match)
INSERT INTO posts (id, author_id, content, image_url, created_at)
SELECT * FROM (VALUES
  ('77777777-7777-7777-7777-777777777701'::uuid,'22222222-2222-2222-2222-222222222201'::uuid,'Just shipped the new auth endpoints for the Customer Portal. JWT refresh rotation is working and tests are green. On to the billing webhooks next!', NULL, now() - interval '5 hours'),
  ('77777777-7777-7777-7777-777777777702'::uuid,'22222222-2222-2222-2222-222222222207'::uuid,'Redesigned the portal header this week — cleaner nav, better hierarchy, and it passes WCAG AA contrast. Mockups are in the shared folder, would love feedback.', 'https://images.pexels.com/photos/3781338/pexels-photo-3781338.jpeg?auto=compress&cs=tinysrgb&w=900', now() - interval '9 hours'),
  ('77777777-7777-7777-7777-777777777703'::uuid,'22222222-2222-2222-2222-222222222203'::uuid,'Welcoming our newest hires next Monday. Onboarding checklist is updated and ready in the HR platform. If you see a new face, say hi!', NULL, now() - interval '1 day'),
  ('77777777-7777-7777-7777-777777777704'::uuid,'22222222-2222-2222-2222-222222222205'::uuid,'Big win for the sales team — closed the deal with Northwind Ltd. after three months of nurturing. Thank you to everyone who supported the technical eval.', NULL, now() - interval '1 day 4 hours'),
  ('77777777-7777-7777-7777-777777777705'::uuid,'22222222-2222-2222-2222-222222222210'::uuid,'Migrated the CI pipeline to parallel stages this morning. Build time dropped from 11m to 4m. Boring deploys are the best deploys.', NULL, now() - interval '2 days')
) AS v(id, author_id, content, image_url, created_at)
ON CONFLICT (id) DO NOTHING;

-- Seed a few likes
INSERT INTO post_likes (post_id, employee_id)
SELECT p.id, e.id
FROM posts p
CROSS JOIN employees e
WHERE e.id <> p.author_id
  AND (abs(hashtext(p.id::text || e.id::text)) % 3) = 0
ON CONFLICT DO NOTHING;

-- Seed comments (idempotent via NOT EXISTS check)
INSERT INTO post_comments (post_id, author_id, content)
SELECT p.id, '22222222-2222-2222-2222-222222222202'::uuid, 'Nice work! The refresh rotation will save us a ton of support tickets.'
FROM posts p
WHERE p.content LIKE 'Just shipped the new auth%'
AND NOT EXISTS (SELECT 1 FROM post_comments pc WHERE pc.post_id = p.id AND pc.author_id = '22222222-2222-2222-2222-222222222202')
ON CONFLICT DO NOTHING;

INSERT INTO post_comments (post_id, author_id, content)
SELECT p.id, '22222222-2222-2222-2222-222222222201'::uuid, 'The hierarchy is so much clearer now. Love the accessibility pass.'
FROM posts p
WHERE p.content LIKE 'Redesigned the portal header%'
AND NOT EXISTS (SELECT 1 FROM post_comments pc WHERE pc.post_id = p.id AND pc.author_id = '22222222-2222-2222-2222-222222222201')
ON CONFLICT DO NOTHING;

-- Seed conversations
INSERT INTO conversations (id) VALUES ('66666666-6666-6666-6666-666666666601') ON CONFLICT DO NOTHING;
INSERT INTO conversation_members (conversation_id, employee_id) VALUES
  ('66666666-6666-6666-6666-666666666601','22222222-2222-2222-2222-222222222202'),
  ('66666666-6666-6666-6666-666666666601','22222222-2222-2222-2222-222222222201')
ON CONFLICT DO NOTHING;
INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
  ('66666666-6666-6666-6666-666666666601','22222222-2222-2222-2222-222222222202','Morning Sarah — how are the auth endpoints coming along?', now() - interval '2 days'),
  ('66666666-6666-6666-6666-666666666601','22222222-2222-2222-2222-222222222201','Just shipped them! Refresh rotation is live and tests pass.', now() - interval '2 days' + interval '20 minutes'),
  ('66666666-6666-6666-6666-666666666601','22222222-2222-2222-2222-222222222202','Awesome. Billing webhooks next?', now() - interval '2 days' + interval '25 minutes'),
  ('66666666-6666-6666-6666-666666666601','22222222-2222-2222-2222-222222222201','Yep, picking that up this afternoon.', now() - interval '2 days' + interval '28 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO conversations (id) VALUES ('66666666-6666-6666-6666-666666666602') ON CONFLICT DO NOTHING;
INSERT INTO conversation_members (conversation_id, employee_id) VALUES
  ('66666666-6666-6666-6666-666666666602','22222222-2222-2222-2222-222222222203'),
  ('66666666-6666-6666-6666-666666666602','22222222-2222-2222-2222-222222222202')
ON CONFLICT DO NOTHING;
INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
  ('66666666-6666-6666-6666-666666666602','22222222-2222-2222-2222-222222222203','Hi Marcus, can we sync on the onboarding checklist flow this week?', now() - interval '1 day'),
  ('66666666-6666-6666-6666-666666666602','22222222-2222-2222-2222-222222222202','Sure — Thursday afternoon works. I will send a meeting invite.', now() - interval '1 day' + interval '10 minutes'),
  ('66666666-6666-6666-6666-666666666602','22222222-2222-2222-2222-222222222203','Perfect, thanks!', now() - interval '1 day' + interval '12 minutes')
ON CONFLICT DO NOTHING;
