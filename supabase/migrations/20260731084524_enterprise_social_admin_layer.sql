/*
# Enterprise social + admin customization layer

## Overview
Adds: (1) app_settings table for admin theme/UI/icon customization,
(2) file attachments + message types on messages table, (3) a call_signaling
table for WebRTC peer-to-peer voice/video call signaling via Supabase Realtime,
(4) a storage bucket for chat file uploads.

## 1. New Tables
- `app_settings` — single-row key/value store for admin-customizable theme,
  layout, accent color, icon set, and other UI configuration. Columns:
  id, theme_key, accent_color, icon_set, layout_density, sidebar_style,
  font_family, custom_logo_url, custom_labels (jsonb), updated_at.
- `call_signaling` — transient WebRTC signaling messages (offer, answer,
  ICE candidates, call-start, call-end). Columns: id, call_id, conversation_id,
  sender_id, receiver_id, type, payload (jsonb), created_at.

## 2. Modified Tables
- `messages` — add `message_type` (text|file|call), `file_url`, `file_name`,
  `file_size` columns (all nullable, additive only).

## 3. Storage
- Create public bucket `chat-files` for message file uploads.

## 4. Security
- RLS on all new tables (TO anon, authenticated, public/shared — no-auth app).
- Storage policies allowing anon to upload/read chat-files bucket.
*/

-- =========================================================
-- APP SETTINGS (theme + UI customization)
-- =========================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_key text NOT NULL DEFAULT 'atlas-midnight',
  accent_color text NOT NULL DEFAULT '#4f46e5',
  icon_set text NOT NULL DEFAULT 'lucide',
  layout_density text NOT NULL DEFAULT 'comfortable' CHECK (layout_density IN ('compact','comfortable','spacious')),
  sidebar_style text NOT NULL DEFAULT 'expanded' CHECK (sidebar_style IN ('expanded','icons-only','hidden')),
  font_family text NOT NULL DEFAULT 'inter',
  custom_logo_url text,
  custom_labels jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_settings" ON app_settings;
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_app_settings" ON app_settings;
CREATE POLICY "anon_insert_app_settings" ON app_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_app_settings" ON app_settings;
CREATE POLICY "anon_update_app_settings" ON app_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_app_settings" ON app_settings;
CREATE POLICY "anon_delete_app_settings" ON app_settings FOR DELETE
  TO anon, authenticated USING (true);

-- Seed a default settings row if none exists
INSERT INTO app_settings (theme_key, accent_color, icon_set, layout_density, sidebar_style, font_family)
SELECT 'atlas-midnight', '#4f46e5', 'lucide', 'comfortable', 'expanded', 'inter'
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- =========================================================
-- CALL SIGNALING (WebRTC)
-- =========================================================
CREATE TABLE IF NOT EXISTS call_signaling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id text NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  receiver_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('offer','answer','ice-candidate','call-start','call-end','call-rejected','ringing')),
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE call_signaling ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_call_signaling" ON call_signaling;
CREATE POLICY "anon_select_call_signaling" ON call_signaling FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_call_signaling" ON call_signaling;
CREATE POLICY "anon_insert_call_signaling" ON call_signaling FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_call_signaling" ON call_signaling;
CREATE POLICY "anon_delete_call_signaling" ON call_signaling FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_call_signaling_call ON call_signaling (call_id, created_at);

-- =========================================================
-- MESSAGES: add file attachment + message type columns
-- =========================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type') THEN
    ALTER TABLE messages ADD COLUMN message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','file','call'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_url') THEN
    ALTER TABLE messages ADD COLUMN file_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_name') THEN
    ALTER TABLE messages ADD COLUMN file_name text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'file_size') THEN
    ALTER TABLE messages ADD COLUMN file_size integer;
  END IF;
END $$;

-- =========================================================
-- STORAGE BUCKET for chat files
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anon to upload and read chat-files
DROP POLICY IF EXISTS "anon_upload_chat_files" ON storage.objects;
CREATE POLICY "anon_upload_chat_files" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "anon_read_chat_files" ON storage.objects;
CREATE POLICY "anon_read_chat_files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "anon_delete_chat_files" ON storage.objects;
CREATE POLICY "anon_delete_chat_files" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'chat-files');
