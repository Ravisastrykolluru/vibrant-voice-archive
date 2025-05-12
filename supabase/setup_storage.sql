
-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policy to allow users to upload files
CREATE POLICY "Allow public access to recordings"
ON storage.objects FOR ALL
USING (bucket_id = 'recordings')
WITH CHECK (bucket_id = 'recordings');
