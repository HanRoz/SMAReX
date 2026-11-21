import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Bookmark,
  Flag,
  Shield,
  ExternalLink,
  FileText,
  CalendarDays,
  User,
  HardDrive,
  Trash2,
  Heart,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Sidebar } from "../components/sidebar";

import { userAuth } from "../context/AuthContext";

import {
  isResourceSaved,
  saveResource,
  unsaveResource,
} from "../services/savedService";

import { recordDownload } from "../services/libraryService";

import {
  getResourceById,
  getThumbnailUrl,
  downloadResourceFile,
  deleteResource,
  generateResourceSummary,
} from "../services/resourceService";

import {
  getResourceLikes,
  likeResource,
  unlikeResource,
} from "../services/likeService";

import {
  getComments,
  postComment,
  editComment,
  deleteComment,
  validateComment,
} from "../services/commentService";

import { supabase } from "../supabaseClient";
import { RefreshCw } from "lucide-react";
import {
  REPORT_REASONS,
  hasReportedResource,
  submitResourceReport,
  getResourceReportCount,
} from "../services/reportService";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

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
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentPage, setCommentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

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

  useEffect(() => {
    let active = true;

    async function checkDownloadHistory() {
      if (!id || !session?.user?.id) return;

      const { data, error } = await supabase
        .from("download_history")
        .select("resource_id")
        .eq("resource_id", id)
        .eq("user_id", session.user.id)
        .limit(1);

      if (error) {
        console.error("Download history error:", error);
        return;
      }

      if (active) {
        setHasDownloaded(data.length > 0);
      }
    }

    setHasDownloaded(false);
    checkDownloadHistory();

    return () => {
      active = false;
    };
  }, [id, session?.user?.id]);

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

      try {
        await recordDownload(resource.id);
        setHasDownloaded(true);
        toast.success("Download started and added to your Library");
      } catch (historyError) {
        console.error("Failed to record download:", historyError);
        toast.warning("Download started, but Library history was not updated");
      }
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

    // Ask for confirmation only when removing a saved resource
    if (isSaved) {
      const confirmed = window.confirm(
        `Are you sure you want to remove "${resource.title}" from your saved resources?`
      );

      if (!confirmed) return;
    }

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

  useEffect(() => {
    let active = true;

    async function loadLikes() {
      if (!id) return;

      try {
        const result = await getResourceLikes(id);

        if (active) {
          setLikeCount(result.count);
          setIsLiked(result.isLiked);
        }
      } catch (err) {
        console.error("Failed to load likes:", err);
      }
    }

    loadLikes();

    return () => {
      active = false;
    };
  }, [id]);

  const handleLike = async () => {
    if (!resource || liking || resource.security_status !== "safe") return;

    try {
      setLiking(true);

      if (isLiked) {
        await unlikeResource(resource.id);
      } else {
        await likeResource(resource.id);
      }

      const result = await getResourceLikes(resource.id);
      setLikeCount(result.count);
      setIsLiked(result.isLiked);
    } catch (err) {
      toast.error(err.message || "Failed to update like");
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!resource || !isOwner || deleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${resource.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await deleteResource(resource.id);

      toast.success("Resource deleted successfully");
      navigate("/dashboard");

    } catch (err) {
      console.error("Delete resource error:", err);
      toast.error(err.message || "Failed to delete resource");
    } finally {
      setDeleting(false);
    }
  };

  const wordCount = (value) =>
    value.trim() ? value.trim().split(/\s+/).length : 0;

  async function refreshComments() {
    const result = await getComments(id);
    setComments(result.comments);
    setCommentPage(0);
    setHasMoreComments(result.hasMore);
  }

  useEffect(() => {
    let active = true;
    setComments([]);
    setCommentPage(0);
    setHasMoreComments(false);
    setCommentsLoading(true);

    getComments(id)
      .then((result) => {
        if (!active) return;
        setComments(result.comments);
        setHasMoreComments(result.hasMore);
      })
      .catch((err) => {
        if (active) toast.error(err.message || "Could not load comments");
      })
      .finally(() => {
        if (active) setCommentsLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  async function handlePostComment() {
    if (commentBusy) return;
    try {
      setCommentBusy(true);
      await postComment(id, commentText);
      setCommentText("");
      await refreshComments();
      toast.success("Comment posted");
    } catch (err) {
      toast.error(err.message || "Could not post comment");
    } finally {
      setCommentBusy(false);
    }
  }

  async function handleEditComment(commentId) {
    if (commentBusy) return;
    try {
      setCommentBusy(true);
      await editComment(commentId, editText);
      setEditingId(null);
      setEditText("");
      await refreshComments();
      toast.success("Comment updated");
    } catch (err) {
      toast.error(err.message || "Could not edit comment");
    } finally {
      setCommentBusy(false);
    }
  }

  async function handleDeleteComment(commentId) {
    if (commentBusy || !window.confirm("Delete this comment?")) return;
    try {
      setCommentBusy(true);
      await deleteComment(commentId);
      await refreshComments();
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err.message || "Could not delete comment");
    } finally {
      setCommentBusy(false);
    }
  }

  async function handleLoadMoreComments() {
    if (commentsLoading || !hasMoreComments) return;
    try {
      setCommentsLoading(true);
      const nextPage = commentPage + 1;
      const result = await getComments(id, nextPage);
      setComments((previous) => [
        ...previous,
        ...result.comments.filter(
          (comment) => !previous.some((c) => c.id === comment.id)
        ),
      ]);
      setCommentPage(nextPage);
      setHasMoreComments(result.hasMore);
    } catch (err) {
      toast.error(err.message || "Could not load more comments");
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function checkReport() {
      setHasReported(false);

      if (!id || !session?.user?.id) return;

      try {
        const reported = await hasReportedResource(id);

        if (active) {
          setHasReported(reported);
        }
      } catch (err) {
        console.error("Failed to check report status:", err);
      }
    }

    checkReport();

    return () => {
      active = false;
    };
  }, [id, session?.user?.id]);

  useEffect(() => {
    let active = true;

    async function loadReportCount() {
      setReportCount(0);

      if (!id || !session?.user?.id) return;

      try {
        const count = await getResourceReportCount(id);

        if (active) {
          setReportCount(count);
        }
      } catch (err) {
        console.error("Failed to load report count:", err);
      }
    }

    loadReportCount();

    return () => {
      active = false;
    };
  }, [id, session?.user?.id]);

  const handleSubmitReport = async () => {
    if (!resource || reportSubmitting || hasReported) return;

    if (!reportReason) {
      toast.error("Please select a report reason.");
      return;
    }

    try {
      setReportSubmitting(true);

      await submitResourceReport(
        resource.id,
        reportReason,
        reportDescription
      );
      try {
        const updatedCount = await getResourceReportCount(resource.id);
        setReportCount(updatedCount);
      } catch (countError) {
        console.error("Failed to refresh report count:", countError);
      }

      setHasReported(true);
      setShowReportForm(false);
      setReportReason("");
      setReportDescription("");

      toast.success("Report submitted successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to submit report.");

      if (err.code === "23505" ||
        err.message === "You have already reported this resource.") {
        setHasReported(true);
        setShowReportForm(false);
      }
    } finally {
      setReportSubmitting(false);
    }
  };

// ---------------------------------------------
// AI RESOURCE SUMMARY
// ---------------------------------------------

useEffect(() => {
  if (resource) {
    setAiSummary(resource.ai_summary || "");
    setSummaryError("");
  }
}, [resource]);

const handleAISummary = async () => {
  if (summaryLoading) return;

  // If summary already exists, simply show or hide it.
  if (aiSummary) {
    setShowAISummary((previous) => !previous);
    return;
  }

  try {
    setSummaryLoading(true);
    setSummaryError("");
    setShowAISummary(true);

    const result = await generateResourceSummary(id);

    setAiSummary(result.summary);

    setResource((previous) => ({
      ...previous,
      ai_summary: result.summary,
      summary_status: "completed",
      summary_generation_count: result.generation_count,
    }));

    toast.success(
      result.cached
        ? "AI summary loaded successfully"
        : "AI summary generated successfully"
    );

  } catch (err) {
    console.error("AI summary error:", err);

    setSummaryError(
      err.message || "Unable to generate AI summary."
    );

    toast.error(
      err.message || "Failed to generate AI summary."
    );

  } finally {
    setSummaryLoading(false);
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

                {/* Security Status and VirusTotal Details */}
                <div className="flex flex-wrap items-center gap-3 mb-6">

                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-muted-foreground" />

                    <span className="text-sm font-medium">
                      Security Status:
                    </span>

                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${statusStyles[resource.security_status] ||
                        statusStyles.pending
                        }`}
                    >
                      {statusLabels[resource.security_status] || "Pending Review"}
                    </span>
                  </div>

                  {/* VirusTotal Security Details */}
                  {resource.security_status === "safe" &&
                    /^[a-fA-F0-9]{64}$/.test(resource.file_sha256 || "") && (
                      <a
                        href={`https://www.virustotal.com/gui/file/${resource.file_sha256}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
          inline-flex items-center gap-2
          border border-border rounded-md
          px-3 py-1.5 text-xs font-medium
          hover:bg-accent transition-colors
        "
                      >
                        Security Details
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                </div>

                {resource.security_status === "pending" && (
                  <p className="text-sm text-yellow-700 mb-4">
                    This resource has not been scanned yet.
                    It is not publicly available.
                  </p>
                )}

               
{/* AI Summarization Section */}
<div className="mb-6">

  {/* AI Summary Content */}
  {showAISummary && (
    <div className="
      mt-4
      p-5
      bg-secondary
      border border-border
      rounded-xl
      animate-in fade-in slide-in-from-top-2 duration-300
    ">

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-primary" />

        <h3 className="font-semibold text-foreground">
          AI-Generated Summary
        </h3>
      </div>

      {summaryLoading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">

          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />

          <p className="text-sm text-muted-foreground">
            Reading document and generating summary...
          </p>

          <p className="text-xs text-muted-foreground">
            This may take a little while.
          </p>

        </div>

      ) : summaryError ? (

        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 p-4">

          <p className="text-sm text-red-600 dark:text-red-400">
               "Something went wrong while generating the summary. Please try again."
          </p>

          <button
            type="button"
            onClick={handleAISummary}
            className="mt-3 text-sm font-medium text-red-600 underline"
          >
            Try again
          </button>

        </div>

      ) : aiSummary ? (

      <div className="ai-summary-content text-sm leading-6 text-gray-800 dark:text-black-200 space-y-0">
     
<div className="ai-summary-content">

<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkMath]}
  rehypePlugins={[rehypeKatex]}
  components={{
    h1: ({ children }) => (
      <h1 className="text-xl font-bold mt-4 mb-2">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-bold mt-3 mb-1">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-semibold mt-3 mb-1">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-sm leading-6 mb-1.5">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-5 space-y-0.5 mb-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-5 space-y-0.5 mb-2">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-sm leading-6">
        {children}
      </li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold">
        {children}
      </strong>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-2 rounded-lg border border-gray-300 dark:border-gray-700">
        <table className="w-full text-sm border-collapse bg-gray-50 dark:bg-gray-900">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-200 dark:bg-gray-700">
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-left font-semibold text-gray-900 dark:text-white">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
        {children}
      </td>
    ),
  }}
>
  {aiSummary}
</ReactMarkdown>

</div>

        </div>

      ) : (

        <p className="text-sm text-muted-foreground">
          No summary available.
        </p>

      )}

      <hr className="my-4 border-0 border-t border-border/90" />

      <p className="text-xs text-muted-foreground italic">
        <strong className="font-bold not-italic">Note:</strong>{" "}
        This AI-generated summary is based on the resource content and
        may contain inaccuracies, misinterpretations or missing information.
        It is intended as a supplementary learning aid and should not
        replace reading the original document. Please review the original
        resource for complete information.
      </p>

    </div>
  )}

</div>

{/* AI Summary Button */}
<div className="flex flex-wrap gap-3">

  <button
    type="button"
    onClick={handleAISummary}
    disabled={summaryLoading || resource.security_status !== "safe"}
    aria-label={
      showAISummary
        ? "Hide AI summary"
        : aiSummary
          ? "Show AI summary"
          : "Generate AI summary"
    }
    aria-expanded={showAISummary}
    className="
      group
      inline-flex items-center justify-center
      bg-primary text-primary-foreground
      rounded-full
      p-2
      hover:px-3
      transition-all duration-300 ease-in-out
      shadow-sm hover:shadow-md
      shrink-0
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
  >

    {summaryLoading ? (
      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
    ) : (
      <Sparkles className="w-4 h-4 shrink-0" />
    )}

    <span
      className={`
        text-xs font-medium
        overflow-hidden whitespace-nowrap
        transition-all duration-300 ease-in-out
        ${showAISummary || summaryLoading
          ? "max-w-40 ml-1.5 opacity-100"
          : "max-w-0 ml-0 opacity-0 group-hover:max-w-40 group-hover:ml-1.5 group-hover:opacity-100"
        }
      `}
    >
      {summaryLoading
        ? "Generating..."
        : showAISummary
          ? "Hide AI summary"
          : aiSummary
            ? "Show AI summary"
            : "Generate AI summary"}
    </span>

  </button>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    disabled={!canDownload || downloading}
                    className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hasDownloaded
                      ? "border border-primary text-primary hover:bg-primary/10"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                  >
                    {hasDownloaded ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}

                    {downloading
                      ? "Downloading..."
                      : hasDownloaded
                        ? "Download Again"
                        : `Download (${formatFileSize(resource.file_size)})`}
                  </button>

                  {/* Save Button */}
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

                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={liking || resource.security_status !== "safe"}
                    className="inline-flex items-center gap-2 border border-border rounded-md px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Heart
                      className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""
                        }`}
                    />
                    {isLiked ? "Liked" : "Like"} ({likeCount})
                  </button>

                  {/* Report Button */}
                  <button
                    type="button"
                    onClick={() => setShowReportForm(true)}
                    disabled={
                      hasReported ||
                      reportSubmitting ||
                      resource.security_status !== "safe"
                    }
                    className={`inline-flex items-center gap-2 border rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${hasReported
                      ? "border-border text-muted-foreground opacity-60"
                      : "border-border hover:bg-accent disabled:opacity-50"
                      }`}
                  >
                    <Flag className={`w-4 h-4 ${hasReported ? "fill-current" : ""}`} />
                    {hasReported ? "Reported" : "Report"} ({reportCount})
                  </button>

                  {/* Delete Button */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>

                {showReportForm && !hasReported && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                    <h3 className="font-semibold">Report Resource</h3>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Reason <span className="text-red-500">*</span>
                      </label>

                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select a reason</option>

                        {REPORT_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Additional details (optional)
                      </label>

                      <textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Explain why you're reporting this resource..."
                        className="w-full rounded-md border border-input bg-background p-3 text-sm resize-y"
                      />

                      <p className="text-xs text-muted-foreground text-right">
                        {reportDescription.length}/500 characters
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowReportForm(false);
                          setReportReason("");
                          setReportDescription("");
                        }}
                        disabled={reportSubmitting}
                        className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitReport}
                        disabled={reportSubmitting || !reportReason}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {reportSubmitting ? "Submitting..." : "Submit Report"}
                      </button>
                    </div>
                  </div>
                )}

                {!canDownload && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Download is unavailable for this resource.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">

              <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-semibold">Comments</h2>

                {resource.security_status === "safe" ? (
                  <div className="space-y-2">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share feedback about this resource..."
                      rows={3}
                      maxLength={700}
                      className="w-full border border-border bg-background rounded-md p-3 text-sm resize-y"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {wordCount(commentText)}/100 words · {Array.from(commentText).length}/700 characters
                      </span>
                      <button
                        type="button"
                        onClick={handlePostComment}
                        disabled={commentBusy || !commentText.trim() ||
                          wordCount(commentText) > 100}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm disabled:opacity-50"
                      >
                        {commentBusy ? "Please wait..." : "Post Comment"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Commenting is available only for resources marked safe.
                  </p>
                )}

                <div className="space-y-4">
                  {comments.map((comment) => {
                    const ownComment = comment.user_id === session?.user?.id;
                    const isEditing = editingId === comment.id;
                    const wasEdited =
                      new Date(comment.updated_at).getTime() >
                      new Date(comment.created_at).getTime() + 1000;

                    return (
                      <div key={comment.id} className="border-t border-border pt-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {comment.authorName}
                              {ownComment && " (You)"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(comment.created_at)}
                              {wasEdited && " · Edited"}
                            </p>
                          </div>

                          {ownComment && (
                            <div className="flex gap-3 text-sm">
                              <button
                                type="button"
                                disabled={commentBusy}
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditText(comment.content);
                                }}
                                className="text-primary hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={commentBusy}
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editText}
                              maxLength={700}
                              rows={3}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full border border-border bg-background rounded-md p-3 text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              {wordCount(editText)}/100 words · {Array.from(editText).length}/700 characters
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={commentBusy || !editText.trim() ||
                                  wordCount(editText) > 100}
                                onClick={() => handleEditComment(comment.id)}
                                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="border border-border px-3 py-1.5 rounded-md text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {resource.security_status === "safe" &&
                    !commentsLoading &&
                    comments.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No comments yet. Be the first to leave feedback.
                      </p>
                    )}

                  {hasMoreComments && (
                    <button
                      type="button"
                      onClick={handleLoadMoreComments}
                      disabled={commentsLoading}
                      className="border border-border rounded-md px-4 py-2 text-sm disabled:opacity-50"
                    >
                      {commentsLoading ? "Loading..." : "Load More Comments"}
                    </button>
                  )}

                  {commentsLoading && comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">Loading comments...</p>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </Sidebar>
  );
}