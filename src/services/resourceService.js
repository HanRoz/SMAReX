
import { supabase } from "../supabaseClient";

const MB = 1024 * 1024;

const DOCUMENT_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
};

const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function validateDocument(file) {
  if (!file) {
    throw new Error("Please select a document.");
  }

  if (!DOCUMENT_TYPES[file.type]) {
    throw new Error("Only PDF, DOCX and PPTX files are allowed.");
  }

  if (file.size === 0 || file.size > 50 * MB) {
    throw new Error("File size must be between 1 byte and 50 MB.");
  }
}

export function validateThumbnail(file) {
  if (!file) return;

  if (!IMAGE_TYPES[file.type]) {
    throw new Error("Only JPG, PNG and WebP thumbnails are allowed.");
  }

  if (file.size === 0 || file.size > 5 * MB) {
    throw new Error("Thumbnail must be between 1 byte and 5 MB.");
  }
}

export async function uploadResource({
  file,
  thumbnail,
  title,
  description,
  kulliyyah,
  subjectCode,
  tags,
}) {
  validateDocument(file);
  validateThumbnail(thumbnail);

  if (
    !title?.trim() ||
    !description?.trim() ||
    !kulliyyah?.trim() ||
    !subjectCode?.trim()
  ) {
    throw new Error("Please complete all required fields.");
  }

  // Identify the logged-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in before uploading.");
  }

  // Unique identifier prevents filename collisions
  const resourceId = crypto.randomUUID();

  const filePath =
    `${user.id}/documents/${resourceId}${DOCUMENT_TYPES[file.type]}`;

  const thumbnailPath = thumbnail
    ? `${user.id}/thumbnails/${resourceId}${IMAGE_TYPES[thumbnail.type]}`
    : null;

  let fileUploaded = false;
  let thumbnailUploaded = false;

  try {
    // 1. Upload document into private Storage bucket
    const { error: fileError } = await supabase.storage
      .from("resources")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (fileError) throw fileError;
    fileUploaded = true;

    // 2. Upload optional preview image
    if (thumbnail && thumbnailPath) {
      const { error: imageError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbnailPath, thumbnail, {
          contentType: thumbnail.type,
          upsert: false,
        });

      if (imageError) throw imageError;
      thumbnailUploaded = true;
    }

    // 3. Save metadata in PostgreSQL
    const { data, error: databaseError } = await supabase
      .from("resources")
      .insert({
        id: resourceId,
        uploader_id: user.id,
        title: title.trim(),
        description: description.trim(),
        kulliyyah: kulliyyah.trim(),
        subject_code: subjectCode.trim(),
        tags: (tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        thumbnail_path: thumbnailPath,
        security_status: "pending",
      })
      .select()
      .single();

    if (databaseError) throw databaseError;

    return data;
  } catch (error) {
    // Clean up uploaded files if something fails.
    // This is best-effort cleanup, not a transaction.
    if (thumbnailUploaded) {
      const { error: cleanupError } = await supabase.storage
        .from("thumbnails")
        .remove([thumbnailPath]);

      if (cleanupError) {
        console.error("Thumbnail cleanup failed:", cleanupError);
      }
    }

    if (fileUploaded) {
      const { error: cleanupError } = await supabase.storage
        .from("resources")
        .remove([filePath]);

      if (cleanupError) {
        console.error("Document cleanup failed:", cleanupError);
      }
    }

    throw error;
  }
}

export async function getMyResources() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in to view your resources.");
  }

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("uploader_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}
export async function getThumbnailUrl(thumbnailPath) {
  if (!thumbnailPath) return null;

  const { data, error } = await supabase.storage
    .from("thumbnails")
    .createSignedUrl(thumbnailPath, 3600);

  if (error) throw error;

  return data.signedUrl;
}