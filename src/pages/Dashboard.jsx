import { useEffect, useMemo, useState } from "react";
import { Search, FileText, CalendarDays, HardDrive, ShieldCheck, Download, Heart, Bookmark, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Sidebar } from "../components/sidebar";
import { userAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

import {
  getDashboardResources,
  getThumbnailUrl,
} from "../services/resourceService";

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { downloadResourceFile } from "../services/resourceService";
import { recordDownload } from "../services/libraryService";
import {
  isResourceSaved,
  saveResource,
  unsaveResource,
} from "../services/savedService";
import {
  getResourceLikes,
  likeResource,
  unlikeResource,
} from "../services/likeService";



const KULLIYYAHS = [
  "AIKOL", "KENMS", "KOED", "KICT", "KIRKHS",
  "KOM", "KOD", "ISTAC", "KOP", "KON",
  "KAHS", "KOS", "KSTCL", "KOE", "IIiBF",
  "INHART", "PLANETIIUM",
];

export default function Dashboard() {
  const { profile, session } = userAuth();
  const navigate = useNavigate();

  const [resourceActions, setResourceActions] = useState({});
  const [busyActions, setBusyActions] = useState({});
  const [downloadedIds, setDownloadedIds] = useState(new Set());

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [kulliyyahFilter, setKulliyyahFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    let active = true;

    async function loadResources() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardResources();

        const resourcesWithThumbnails = await Promise.all(
          data.map(async (resource) => {
            if (!resource.thumbnail_path) {
              return { ...resource, thumbnailUrl: null };
            }

            try {
              const thumbnailUrl = await getThumbnailUrl(
                resource.thumbnail_path
              );

              return { ...resource, thumbnailUrl };
            } catch (err) {
              console.error("Thumbnail error:", err);
              return { ...resource, thumbnailUrl: null };
            }
          })
        );

        if (active) {
          setResources(resourcesWithThumbnails);
        }
      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (active) {
          setError(err.message || "Failed to load resources.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadResources();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadActions() {
      const safeResources = resources.filter(
        (resource) => resource.security_status === "safe"
      );

      const results = await Promise.all(
        safeResources.map(async (resource) => {
          const [likes, saved] = await Promise.allSettled([
            getResourceLikes(resource.id),
            isResourceSaved(resource.id),
          ]);

          if (likes.status === "rejected") {
            console.error("Failed to load likes:", likes.reason);
          }
          if (saved.status === "rejected") {
            console.error("Failed to load saved status:", saved.reason);
          }

          return {
            id: resource.id,
            values: {
              ...(likes.status === "fulfilled"
                ? { isLiked: likes.value.isLiked, likeCount: likes.value.count }
                : {}),
              ...(saved.status === "fulfilled"
                ? { isSaved: saved.value }
                : {}),
            },
          };
        })
      );

      if (!active) return;

      setResourceActions((previous) => {
        const next = { ...previous };

        for (const result of results) {
          next[result.id] = {
            ...next[result.id],
            ...result.values,
          };
        }

        return next;
      });
    }

    loadActions();

    return () => {
      active = false;
    };
  }, [resources]);

  const runAction = async (resourceId, actionName, operation) => {
    const key = `${resourceId}:${actionName}`;

    if (busyActions[key]) return;

    setBusyActions((previous) => ({ ...previous, [key]: true }));

    try {
      await operation();
    } catch (err) {
      console.error(`${actionName} error:`, err);
      toast.error(err.message || `${actionName} failed`);
    } finally {
      setBusyActions((previous) => ({ ...previous, [key]: false }));
    }
  };

  const handleDashboardDownload = (resource) =>
    runAction(resource.id, "download", async () => {
      if (resource.security_status !== "safe") return;

      await downloadResourceFile(resource);

      try {
        await recordDownload(resource.id);

        // Mark this resource as downloaded
        setDownloadedIds((previous) => {
          const updated = new Set(previous);
          updated.add(resource.id);
          return updated;
        });

        toast.success("Download started and added to your Library");
      } catch (err) {
        console.error("Download history error:", err);
        toast.warning("Download started, but Library history was not updated");
      }
    });

  const handleDashboardLike = (resource) =>
    runAction(resource.id, "like", async () => {
      if (resource.security_status !== "safe") return;

      const current = await getResourceLikes(resource.id);

      if (current.isLiked) {
        await unlikeResource(resource.id);
      } else {
        await likeResource(resource.id);
      }

      const updated = await getResourceLikes(resource.id);

      setResourceActions((previous) => ({
        ...previous,
        [resource.id]: {
          ...previous[resource.id],
          isLiked: updated.isLiked,
          likeCount: updated.count,
        },
      }));
    });

  const handleDashboardSave = (resource) =>
    runAction(resource.id, "save", async () => {
      if (resource.security_status !== "safe") return;

      const currentlySaved = await isResourceSaved(resource.id);

      if (currentlySaved) {
        await unsaveResource(resource.id);
      } else {
        await saveResource(resource.id);
      }

      const updated = await isResourceSaved(resource.id);

      setResourceActions((previous) => ({
        ...previous,
        [resource.id]: {
          ...previous[resource.id],
          isSaved: updated,
        },
      }));

      toast.success(updated ? "Resource saved" : "Removed from saved resources");
    });

  useEffect(() => {
    let active = true;

    async function loadDownloadHistory() {
      setDownloadedIds(new Set());

      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("download_history")
        .select("resource_id")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Failed to load download history:", error);
        return;
      }

      if (active) {
        setDownloadedIds(
          new Set((data || []).map((row) => row.resource_id))
        );
      }
    }

    loadDownloadHistory();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const filteredResources = useMemo(() => {
    let filtered = [...resources];

    const keyword = search.trim().toLowerCase();

    if (keyword) {
      filtered = filtered.filter((resource) => {
        return (
          resource.title?.toLowerCase().includes(keyword) ||
          resource.description?.toLowerCase().includes(keyword) ||
          resource.subject_code?.toLowerCase().includes(keyword) ||
          resource.tags?.some((tag) =>
            tag.toLowerCase().includes(keyword)
          )
        );
      });
    }

    if (kulliyyahFilter !== "all") {
      filtered = filtered.filter(
        (resource) => resource.kulliyyah === kulliyyahFilter
      );
    }

    if (sortBy === "oldest") {
      filtered.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    } else if (sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      filtered.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }

    return filtered;
  }, [resources, search, kulliyyahFilter, sortBy]);

  const formatFileSize = (bytes) => {
    if (bytes == null) return "Unknown size";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date) => {
    if (!date) return "Unknown date";

    return new Date(date).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatus = (status) => {
    switch (status) {
      case "safe":
        return {
          label: "Safe",
          className: "bg-green-100 text-green-800 border-green-200",
        };

      case "suspicious":
        return {
          label: "Suspicious",
          className: "bg-orange-100 text-orange-800 border-orange-200",
        };

      case "malicious":
        return {
          label: "Malicious",
          className: "bg-red-100 text-red-800 border-red-200",
        };

      default:
        return {
          label: "Pending Review",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
    }
  };

  return (
    <Sidebar>
      <div className="space-y-6">

        {/* Page Heading and Content Policy */}
        <div>
          <div className="mb-3 space-y-2">
            <h1 className="text-2xl font-semibold mb-2">
              Welcome, {profile?.display_name || "User"}
            </h1>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Discover and share academic resources with the IIUM community.
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-primary rounded-lg p-3">
            <p className="text-sm font-semibold text-primary mb-1">
              📝 Content Policy:
            </p>

            <p className="text-sm text-gray-900 leading-relaxed">
              <strong className="text-primary">ALLOWED:</strong>{" "}
              Only original student-created or lecturer-permitted notes,
              summaries, tutorials, and revision materials.
            </p>

            <p className="text-sm text-gray-900 leading-relaxed mt-1">
              <strong className="text-destructive">PROHIBITED:</strong>{" "}
              Copyrighted books, commercial content, and unauthorized
              lecturer materials.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">

          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />

            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 pl-10 text-sm"
            />
          </div>

          <select
            value={kulliyyahFilter}
            onChange={(e) => setKulliyyahFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full md:w-[200px]"
          >
            <option value="all">All Kulliyyahs</option>

            {KULLIYYAHS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm w-full md:w-[200px]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>

        {/* Resource Count */}
        {!loading && !error && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredResources.length} resource
            {filteredResources.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading resources...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4">
            Failed to load resources: {error}
          </div>
        )}


        {/* Resource Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredResources.map((resource) => {
              const status = getStatus(resource.security_status);
              const isSafe = resource.security_status === "safe";
              const actions = resourceActions[resource.id] || {};

              const downloadBusy = busyActions[`${resource.id}:download`];
              const likeBusy = busyActions[`${resource.id}:like`];
              const saveBusy = busyActions[`${resource.id}:save`];

              return (
                <div
                  key={resource.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/resource/${resource.id}`)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter") {
                      navigate(`/resource/${resource.id}`);
                    }
                  }}
                  aria-label={`View details for ${resource.title}`}
                  className="flex flex-col sm:flex-row bg-card border border-border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {/* Thumbnail */}
                  <div className="sm:w-36 h-40 sm:h-auto bg-primary/10 flex items-center justify-center shrink-0">
                    {resource.thumbnailUrl ? (
                      <img
                        src={resource.thumbnailUrl}
                        alt={`${resource.title} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-12 h-12 text-primary" />
                    )}
                  </div>

                  {/* Resource Information */}
                  <div className="flex-1 min-w-0 p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-lg break-words">
                        {resource.title}
                      </h3>

                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {resource.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{resource.kulliyyah}</span>
                      <span>•</span>
                      <span>{resource.subject_code}</span>
                    </div>

                    {resource.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {resource.tags.map((tag, index) => (
                          <span
                            key={`${resource.id}-${index}`}
                            className="text-xs px-2 py-1 bg-secondary rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(resource.file_size)}
                      </span>

                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(resource.created_at)}
                      </span>
                    </div>

                    {resource.security_status === "pending" && (
                      <p className="text-xs text-yellow-700">
                        Awaiting security scan. Not publicly available.
                      </p>
                    )}
                  </div>

                  {/* Right: Quick Actions */}
                  <div
                    className="flex sm:flex-col sm:w-28 shrink-0 items-stretch justify-center gap-2 p-3 border-t sm:border-t-0 sm:border-l border-border bg-muted/30"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {/* Like */}
                    <button
                      type="button"
                      onClick={() => handleDashboardLike(resource)}
                      disabled={!isSafe || likeBusy}
                      aria-pressed={Boolean(actions.isLiked)}
                      className="flex-1 flex sm:flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-card p-2 text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Heart
                        className={`w-5 h-5 ${actions.isLiked
                            ? "fill-red-500 text-red-500"
                            : ""
                          }`}
                      />
                      <span>
                        {actions.isLiked ? "Liked" : "Like"}
                        {actions.likeCount != null
                          ? ` (${actions.likeCount})`
                          : ""}
                      </span>
                    </button>

                    {/* Download / Download Again */}
                    <button
                      type="button"
                      onClick={() => handleDashboardDownload(resource)}
                      disabled={!isSafe || downloadBusy}
                      className="flex-1 flex sm:flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-card p-2 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={
                        !isSafe
                          ? "Download unavailable"
                          : downloadedIds.has(resource.id)
                            ? "Download again"
                            : "Download resource"
                      }
                    >
                      {downloadedIds.has(resource.id) ? (
                        <RefreshCw className="w-5 h-5 text-primary" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}

                      <span>
                        {downloadBusy
                          ? "Wait..."
                          : downloadedIds.has(resource.id)
                            ? "Download Again"
                            : "Download"}
                      </span>
                    </button>

                    {/* Save */}
                    <button
                      type="button"
                      // onClick={() => handleDashboardSave(resource)}
                      onClick={() => {
                        // Ask for confirmation only when removing a bookmark
                        if (actions.isSaved) {
                          const confirmed = window.confirm(
                            `Are you sure you want to remove "${resource.title}" from your saved resources?`
                          );

                          if (!confirmed) return;
                        }

                        handleDashboardSave(resource);
                      }}
                      disabled={!isSafe || saveBusy}
                      aria-pressed={Boolean(actions.isSaved)}
                      className="flex-1 flex sm:flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-card p-2 text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Bookmark
                        className={`w-5 h-5 ${actions.isSaved
                            ? "fill-primary text-primary"
                            : ""
                          }`}
                      />
                      <span>{actions.isSaved ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredResources.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />

            <p className="text-muted-foreground">
              No resources found matching your criteria.
            </p>
          </div>
        )}

      </div>
    </Sidebar>
  );
}