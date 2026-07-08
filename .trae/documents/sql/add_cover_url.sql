-- 照片表添加视频封面字段
ALTER TABLE photo ADD COLUMN IF NOT EXISTS cover_url TEXT;
