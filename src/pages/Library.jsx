// import React from 'react'
// import {userAuth} from '../context/AuthContext'
// import { Link, useNavigate } from 'react-router-dom'
// import {Sidebar} from '../components/sidebar'

// const Library = () => {
//   return (
//     <Sidebar>
//       <div>
//         <h1>Library</h1>
//       </div>
//     </Sidebar>
//   )
// }

// export default Library

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Download,
  FileText,
  CalendarDays,
  HardDrive,
} from "lucide-react";

import { Sidebar } from "../components/sidebar";
import { getThumbnailUrl } from "../services/resourceService";
import { getLibraryResources } from "../services/libraryService";

export default function Library() {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      try {
        setLoading(true);
        setError("");

        const data = await getLibraryResources();

        const resourcesWithThumbnails = await Promise.all(
          data.map(async (resource) => {
            if (!resource.thumbnail_path) {
              return {
                ...resource,
                thumbnailUrl: null,
              };
            }

            try {
              const thumbnailUrl = await getThumbnailUrl(
                resource.thumbnail_path
              );

              return {
                ...resource,
                thumbnailUrl,
              };
            } catch (err) {
              console.error("Thumbnail error:", err);

              return {
                ...resource,
                thumbnailUrl: null,
              };
            }
          })
        );

        if (active) {
          setResources(resourcesWithThumbnails);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load your Library.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLibrary();

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
              My Library
            </h1>

            <p className="text-muted-foreground">
              All resources you have downloaded
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="w-4 h-4" />
            <span>{resources.length} resources</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search in library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 pl-10 text-sm"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading your Library...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {/* Resource Cards */}
        {!loading && !error && filteredResources.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredResources.map((resource) => (
              <Link
                key={resource.id}
                to={`/resource/${resource.id}`}
                className="block bg-card border border-border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
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
                      Downloaded {formatDate(resource.downloaded_at)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredResources.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Download className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />

            <p className="text-muted-foreground mb-2">
              {resources.length === 0
                ? "No downloaded resources yet"
                : "No resources match your search"}
            </p>

            <p className="text-sm text-muted-foreground mb-4">
              {resources.length === 0
                ? "Resources you download will appear here."
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