-- 照片墙添加 media_type 字段，支持图片和视频
-- 在 Supabase SQL Editor 中执行即可
ALTER TABLE photo ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';
