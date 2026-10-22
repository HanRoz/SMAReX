import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Bookmark,
  Flag,
  Shield,
  FileText,
  CalendarDays,
  User,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";

import { Sidebar } from "../components/sidebar";
import {
  getResourceById,
  getThumbnailUrl,
  downloadResourceFile,
} from "../services/resourceService";
import { userAuth } from "../context/AuthContext";

import {
  isResourceSaved,
  saveResource,
  unsaveResource,
} from "../services/savedService";

export default function ResourceDetails() {
  const { id } = useParams();
  const { session } = userAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resource, setResource] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadResource() {
      try {
        setLoading(true);
        setError("");

        const data = await getResourceById(id);

        if (active) setResource(data);

        if (data.thumbnail_path) {
          try {
            const url = await getThumbnailUrl(data.thumbnail_path);
            if (active) setThumbnailUrl(url);
          } catch (err) {
            console.error("Thumbnail error:", err);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err.code === "PGRST116"
              ? "Resource not found or you do not have permission to view it."
              : err.message
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResource();
    return () => { active = false; };
  }, [id]);

  const formatFileSize = (bytes) => {
    if (bytes == null) return "Unknown size";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-MY", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Unknown date";

  const handleDownload = async () => {
    if (!resource || downloading) return;

    if (!window.confirm(`Download "${resource.file_name}"?`)) return;

    try {
      setDownloading(true);
      await downloadResourceFile(resource);
      toast.success("Download started");
    } catch (err) {
      toast.error(err.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const statusStyles = {
    safe: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    suspicious: "bg-orange-100 text-orange-800 border-orange-200",
    malicious: "bg-red-100 text-red-800 border-red-200",
  };

  const statusLabels = {
    safe: "Safe",
    pending: "Pending Review",
    suspicious: "Suspicious",
    malicious: "Malicious",
  };

  const isOwner =
    resource?.uploader_id === session?.user?.id;

  // Only the uploader may download an unscanned file
  // for development testing.
  const canDownload =
    resource?.security_status === "safe" ||
    (isOwner && resource?.security_status === "pending");

useEffect(() => {
  let active = true;

  async function checkSaved() {
    setIsSaved(false);

    if (!id) return;

    try {
      const saved = await isResourceSaved(id);

      if (active) {
        setIsSaved(saved);
      }
    } catch (err) {
      console.error("Failed to check saved status:", err);
    }
  }

  checkSaved();

  return () => {
    active = false;
  };
}, [id]);

const handleSave = async () => {
  if (!resource || saving) return;

  try {
    setSaving(true);

    if (isSaved) {
      await unsaveResource(resource.id);
      setIsSaved(false);
      toast.success("Removed from saved resources");
    } else {
      await saveResource(resource.id);
      setIsSaved(true);
      toast.success("Resource saved successfully");
    }
  } catch (err) {
    toast.error(err.message || "Failed to update saved resource");
  } finally {
    setSaving(false);
  }
};

  return (
    <Sidebar>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading resource...
          </div>
        )}

        {!loading && error && (
          <div className="bg-card border rounded-lg p-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Link to="/dashboard" className="text-primary underline">
              Return to Dashboard
            </Link>
          </div>
        )}

        {!loading && !error && resource && (
          <>
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={`${resource.title} thumbnail`}
                  className="w-full h-80 object-cover bg-muted"
                />
              ) : (
                <div className="w-full h-80 bg-primary/10 flex flex-col items-center justify-center gap-3">
                  <FileText className="w-16 h-16 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    No thumbnail available
                  </span>
                </div>
              )}

              <div className="p-6 md:p-8">
                <h1 className="text-2xl font-semibold mb-3">
                  {resource.title}
                </h1>

                <div className="flex flex-wrap gap-2 mb-5">
                  {[resource.kulliyyah, resource.subject_code].map(
                    (value) => (
                      <span
                        key={value}
                        className="border border-border rounded-full px-3 py-1 text-xs font-medium"
                      >
                        {value}
                      </span>
                    )
                  )}

                  {(resource.tags || []).map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="border border-border rounded-full px-3 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {isOwner ? "Uploaded by you" : "Shared resource"}
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {formatDate(resource.created_at)}
                  </div>

                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    {formatFileSize(resource.file_size)}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {resource.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Security Status:
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${
                      statusStyles[resource.security_status] ||
                      statusStyles.pending
                    }`}
                  >
                    {statusLabels[resource.security_status] ||
                      "Pending Review"}
                  </span>
                </div>

                {resource.security_status === "pending" && (
                  <p className="text-sm text-yellow-700 mb-4">
                    This resource has not been scanned yet.
                    It is not publicly available.
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDownload}
                    disabled={!canDownload || downloading}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {downloading
                      ? "Downloading..."
                      : `Download (${formatFileSize(resource.file_size)})`}
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 border border-border rounded-md px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                    <Bookmark
                    className={`w-4 h-4 ${isSaved ? "fill-primary text-primary" : ""}`}
                    />
                    {saving ? "Please wait..." : isSaved ? "Saved" : "Save"}
                  </button>

                  <button
                    disabled
                    title="Coming soon"
                    className="inline-flex items-center gap-2 border rounded-md px-4 py-2 text-sm opacity-50 cursor-not-allowed"
                  >
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>

                {!canDownload && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Download is unavailable for this resource.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">
                Ratings & Comments
              </h2>
              <p className="text-sm text-muted-foreground">
                Ratings and comments will be available after
                we connect these features to Supabase.
              </p>
            </div>
          </>
        )}
      </div>
    </Sidebar>
  );
}