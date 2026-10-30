import { supabase } from "../supabaseClient";

const MB = 1024 * 1024;

const DOCUMENT_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
};

const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};


async function scanFileWithVirusTotal(file, onProgress) {
  const maxWaitTime = 10 * 60 * 1000; // 10 minutes
  const retryDelay = 3000;
  const startTime = Date.now();

  let resume = false;

  console.log("Starting VirusTotal scan:", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  while (Date.now() - startTime < maxWaitTime) {
    const formData = new FormData();
    formData.append("file", file);

    // Resume the existing scan instead of submitting again.
    if (resume) {
      formData.append("resume", "true");
    }

    onProgress?.(
      resume
        ? "VirusTotal is still scanning. Checking again..."
        : "Submitting your file to VirusTotal...",
    );

    const { data, error } = await supabase.functions.invoke("virustotal-scan", {
      body: formData,
    });

    if (error) {
      let serverError = null;

      try {
        if (error.context) {
          serverError = await error.context.json();
        }
      } catch {
        console.error("Could not read Edge Function error response.");
      }

      console.error("VirusTotal Edge Function Error:", {
        message: error.message,
        serverError,
      });

      const err = new Error(
        serverError?.summary ||
          serverError?.error ||
          error.message ||
          "VirusTotal scan failed.",
      );

      err.code = "SCAN_UNAVAILABLE";
      err.details = serverError;

      throw err;
    }

    console.log("VirusTotal response:", data);

    if (!data || typeof data.allowed !== "boolean") {
      const err = new Error("VirusTotal returned an invalid scan response.");

      err.code = "SCAN_UNAVAILABLE";
      throw err;
    }

    // Scan is still processing.
    if (data.pending === true || data.reason === "pending") {
      resume = true;

      onProgress?.("Your file is being scanned. Please wait...");

      await new Promise((resolve) => setTimeout(resolve, retryDelay));

      continue;
    }

    // Threat detected or scan unavailable.
    if (data.allowed !== true) {
      const err = new Error(
        data.summary || "The file was blocked by the security scan.",
      );

      err.code =
        data.reason === "threat_detected" ? "SCAN_BLOCKED" : "SCAN_UNAVAILABLE";

      err.details = data;

      throw err;
    }

    // Completed clean scan.
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      await file.arrayBuffer(),
    );

    const sha256 = Array.from(new Uint8Array(hashBuffer), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    const scanResult = {
      ...data,
      reportUrl:
        data.reportUrl || `https://www.virustotal.com/gui/file/${sha256}`,
    };

    onProgress?.("Security scan passed. Preparing your upload...");

    console.log("VirusTotal scan completed successfully:", scanResult);

    return scanResult;
  }

  // Maximum waiting time reached.
  const err = new Error(
    "The VirusTotal scan is taking longer than expected. Your file was not uploaded. Please try again later.",
  );

  err.code = "SCAN_UNAVAILABLE";

  throw err;
}


/**
 * Validate uploaded documents.
 */
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

/**
 * Validate thumbnail images.
 */
export function validateThumbnail(file) {
  if (!file) return;

  if (!IMAGE_TYPES[file.type]) {
    throw new Error("Only JPG, PNG and WebP thumbnails are allowed.");
  }

  if (file.size === 0 || file.size > 5 * MB) {
    throw new Error("Thumbnail must be between 1 byte and 5 MB.");
  }
}

/**
 * Upload a resource.
 *
 * The document is scanned BEFORE it is uploaded to Supabase Storage.
 * If the scan is pending, unavailable, suspicious or malicious,
 * the upload is stopped.
 */
export async function uploadResource({
  file,
  thumbnail,
  title,
  description,
  kulliyyah,
  subjectCode,
  tags,
  onScanProgress,
}) {
  // Validate document and thumbnail.
  validateDocument(file);
  validateThumbnail(thumbnail);

  // Validate required fields.
  if (
    !title?.trim() ||
    !description?.trim() ||
    !kulliyyah?.trim() ||
    !subjectCode?.trim()
  ) {
    throw new Error("Please complete all required fields.");
  }

  // Verify authenticated user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in before uploading.");
  }

  // SECURITY CHECK:
  // Do not upload anything until VirusTotal confirms a clean scan.
const scanResult = await scanFileWithVirusTotal(file, onScanProgress);

  if (scanResult.allowed !== true) {
    throw new Error("The file has not passed the security scan.");
  }

  console.log("Security scan passed. Starting Supabase upload.");

  // Generate unique resource ID.
  const resourceId = crypto.randomUUID();

  const filePath = `${user.id}/documents/${resourceId}${DOCUMENT_TYPES[file.type]}`;

  const thumbnailPath = thumbnail
    ? `${user.id}/thumbnails/${resourceId}${IMAGE_TYPES[thumbnail.type]}`
    : null;

  let fileUploaded = false;
  let thumbnailUploaded = false;

  try {
    // Upload document to Supabase Storage.
    const { error: fileError } = await supabase.storage
      .from("resources")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (fileError) throw fileError;

    fileUploaded = true;

    // Upload thumbnail if provided.
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

    // Insert resource metadata into database.
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
        security_status: "safe",
      })
      .select()
      .single();

    if (databaseError) throw databaseError;

    console.log("Resource uploaded successfully:", resourceId);

    return {
      ...data,
      virusTotal: scanResult,
    };
  } catch (error) {
    console.error("Resource upload failed:", error);

    // Remove thumbnail if it was uploaded.
    if (thumbnailUploaded && thumbnailPath) {
      const { error: cleanupError } = await supabase.storage
        .from("thumbnails")
        .remove([thumbnailPath]);

      if (cleanupError) {
        console.error("Thumbnail cleanup failed:", cleanupError);
      }
    }

    // Remove document if it was uploaded.
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

/**
 * Get resources uploaded by the current user.
 */
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

/**
 * Get a signed thumbnail URL.
 */
export async function getThumbnailUrl(thumbnailPath) {
  if (!thumbnailPath) return null;

  const { data, error } = await supabase.storage
    .from("thumbnails")
    .createSignedUrl(thumbnailPath, 3600);

  if (error) throw error;

  return data.signedUrl;
}

/**
 * Get dashboard resources.
 */
export async function getDashboardResources() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in to view resources.");
  }

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .or(`security_status.eq.safe,uploader_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

/**
 * Get a resource by ID.
 */
export async function getResourceById(resourceId) {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", resourceId)
    .single();

  if (error) throw error;

  return data;
}

/**
 * Download a resource file.
 */
export async function downloadResourceFile(resource) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in to download.");
  }

  // Defense in depth. Storage RLS must enforce this too.
  if (resource.security_status !== "safe" && resource.uploader_id !== user.id) {
    throw new Error("This resource is not available for download.");
  }

  const { data, error } = await supabase.storage
    .from("resources")
    .download(resource.file_path);

  if (error) throw error;

  const url = URL.createObjectURL(data);

  try {
    const link = document.createElement("a");

    link.href = url;
    link.download = resource.file_name || "resource";

    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

/**
 * Delete a resource.
 */
export async function deleteResource(resourceId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in to delete a resource.");
  }

  // Retrieve the resource and verify ownership.
  const { data: resource, error: fetchError } = await supabase
    .from("resources")
    .select("id, uploader_id, file_path, thumbnail_path")
    .eq("id", resourceId)
    .eq("uploader_id", user.id)
    .single();

  if (fetchError || !resource) {
    throw new Error("Resource not found or you are not its owner.");
  }

  // Remove document from Supabase Storage.
  const { error: documentError } = await supabase.storage
    .from("resources")
    .remove([resource.file_path]);

  if (documentError) {
    throw new Error(`Document deletion failed: ${documentError.message}`);
  }

  // Remove thumbnail if one exists.
  if (resource.thumbnail_path) {
    const { error: thumbnailError } = await supabase.storage
      .from("thumbnails")
      .remove([resource.thumbnail_path]);

    if (thumbnailError) {
      throw new Error(`Thumbnail deletion failed: ${thumbnailError.message}`);
    }
  }

  // Delete resource metadata from PostgreSQL.
  const { data: deletedRows, error: deleteError } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId)
    .eq("uploader_id", user.id)
    .select("id");

  if (deleteError) {
    throw new Error(`Database deletion failed: ${deleteError.message}`);
  }

  if (!deletedRows?.length) {
    throw new Error(
      "Resource metadata was not deleted. Check your Supabase DELETE policy.",
    );
  }

  return true;
}
