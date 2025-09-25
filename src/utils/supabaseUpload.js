// utils/supabaseUpload.js
import { createClient } from '@supabase/supabase-js';

// Replace with your actual project URL and anon key
const supabase = createClient(
  'https://heuigzyutypfjpqzipik.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhldWlnenl1dHlwZmpwcXppcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MjA3MTYsImV4cCI6MjA3Mzk5NjcxNn0.DF8fjinfbOSiP6SjWlxo991auPxerIFjr-UicrRys88'
);

/**
 * Uploads a blob to Supabase Storage and returns the public URL.
 * @param {Blob} blob - The image blob to upload
 * @param {string} fileName - The filename to use (flat path)
 * @param {string} bucket - The bucket name (e.g. 'avatars')
 * @returns {Promise<string|null>} - Public URL or null on failure
 */
export async function uploadToSupabaseStorage(blob, fileName, bucket = 'avatars') {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      console.error('No access token found. User may not be signed in.');
      return null;
    }

    const uploadResponse = await fetch(
      `https://heuigzyutypfjpqzipik.supabase.co/storage/v1/object/${bucket}/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'image/png'
        },
        body: blob
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', errorText);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Upload error:', err);
    return null;
  }
}
