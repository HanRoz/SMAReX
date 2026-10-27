import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Bookmark,
  FileText,
  CalendarDays,
  HardDrive,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Sidebar } from "../components/sidebar";
import { getThumbnailUrl } from "../services/resourceService";
import {
  getSavedResources,
  unsaveResource,
} from "../services/savedService";

export default function Saved() {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadSavedResources() {
      try {
        setLoading(true);
        setError("");

        const data = await getSavedResources();

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
        if (active) {
          setError(err.message || "Failed to load saved resources.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSavedResources();

    return () => {
      active = false;
    };
  }, []);

  const filteredResources = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return resources;

    return resources.filter((resource) => {
      return (
        resource.title?.toLowerCase().includes(keyword) ||
        resource.description?.toLowerCase().includes(keyword) ||
        resource.subject_code?.toLowerCase().includes(keyword) ||
        resource.tags?.some((tag) =>
          tag.toLowerCase().includes(keyword)
        )
      );
    });
  }, [resources, search]);

  const handleRemove = async (resourceId) => {
    if (removingId) return;

    try {
      setRemovingId(resourceId);

      await unsaveResource(resourceId);

      setResources((previous) =>
        previous.filter((resource) => resource.id !== resourceId)
      );

      toast.success("Removed from saved resources");
    } catch (err) {
      toast.error(err.message || "Failed to remove resource");
    } finally {
      setRemovingId(null);
    }
  };

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

  return (
    <Sidebar>
      <div className="space-y-6">

        {/* Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">
              Saved Resources
            </h1>

            <p className="text-muted-foreground">
              Resources you have bookmarked
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bookmark className="w-4 h-4" />
            <span>{resources.length} resources</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search saved resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 pl-10 text-sm"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading saved resources...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* Saved Resource Cards */}
        {!loading && !error && filteredResources.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
              >
                <Link
                  to={`/resource/${resource.id}`}
                  className="block hover:bg-accent/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="h-44 bg-primary/10 flex items-center justify-center overflow-hidden">
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
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-semibold">
                      {resource.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {resource.description}
                    </p>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{resource.kulliyyah}</span>
                      <span>•</span>
                      <span>{resource.subject_code}</span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(resource.file_size)}
                      </span>

                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        Saved {formatDate(resource.saved_at)}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Remove Bookmark */}
                <div className="border-t border-border p-3 flex justify-end">
                  <button
                    // onClick={() => handleRemove(resource.id)}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Are you sure you want to remove "${resource.title}" from your saved resources?`
                      );

                      if (!confirmed) return;

                      handleRemove(resource.id);
                    }}
                    disabled={removingId === resource.id}
                    className="inline-flex items-center gap-2 text-sm text-destructive hover:underline disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {removingId === resource.id
                      ? "Removing..."
                      : "Remove from Saved"}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredResources.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />

            <p className="text-muted-foreground mb-2">
              {resources.length === 0
                ? "No saved resources yet"
                : "No saved resources match your search"}
            </p>

            <p className="text-sm text-muted-foreground mb-4">
              {resources.length === 0
                ? "Bookmark resources to access them quickly later."
                : "Try searching with a different keyword."}
            </p>

            {resources.length === 0 && (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                Browse Resources
              </Link>
            )}
          </div>
        )}
      </div>
    </Sidebar>
  );
}
