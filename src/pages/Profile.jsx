import { useEffect, useState } from "react";
import {
  Mail,
  BookOpen,
  GraduationCap,
  User,
  Shield,
  FileText,
  CalendarDays,
  HardDrive,
  Flag,
  Download,
  Bookmark,
  ArrowUpRight,
  Eye
} from "lucide-react";

import {
  getMyResources,
  getThumbnailUrl,
} from "../services/resourceService";
import { userAuth } from "../context/AuthContext";
import { Badge } from "../assets/ui/badge";
import { Sidebar } from "../components/sidebar";

import { Link } from "react-router-dom";
import { getMyReports } from "../services/reportService";
import { supabase } from "../supabaseClient";

const Profile = () => {
  const { profile, session } = userAuth();

  const [myResources, setMyResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState("");
  const [myReports, setMyReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  // Retrieve actual uploaded resources from Supabase
  useEffect(() => {
    let active = true;

    async function loadResources() {
      try {
        setResourcesLoading(true);
        setResourcesError("");

        const resources = await getMyResources();

        const resourcesWithThumbnails = await Promise.all(
          resources.map(async (resource) => {
            if (!resource.thumbnail_path) {
              return { ...resource, thumbnailUrl: null };
            }

            try {
              const thumbnailUrl = await getThumbnailUrl(
                resource.thumbnail_path
              );

              return { ...resource, thumbnailUrl };
            } catch (error) {
              console.error("Thumbnail loading failed:", error);
              return { ...resource, thumbnailUrl: null };
            }
          })
        );

        if (active) {
          setMyResources(resourcesWithThumbnails);
        }
      } catch (error) {
        console.error("Failed to load resources:", error);

        if (active) {
          setResourcesError(error.message);
        }
      } finally {
        if (active) {
          setResourcesLoading(false);
        }
      }
    }

    loadResources();

    return () => {
      active = false;
    };
  }, []);

  // Create initials from full name
  const getInitials = (name) => {
    if (!name) return "?";

    const words = name.trim().split(" ").filter(Boolean);

    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Convert bytes into readable file size
  const formatFileSize = (bytes) => {
    if (bytes === null || bytes === undefined) return "Unknown size";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format upload date
  const formatDate = (date) => {
    if (!date) return "Unknown date";

    return new Date(date).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Display security status
  const getSecurityStatus = (status) => {
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

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        setReportsLoading(true);
        setReportsError("");

        const reports = await getMyReports();

        if (active) {
          setMyReports(reports);
        }
      } catch (error) {
        console.error("Failed to load reports:", error);

        if (active) {
          setReportsError(error.message || "Failed to load reports.");
        }
      } finally {
        if (active) {
          setReportsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setDownloadedCount(0);
      setSavedCount(0);
      setStatsLoading(false);
      return;
    }

    let active = true;

    async function loadStats() {
      setStatsLoading(true);

      try {
        const userId = session.user.id;

        const [downloads, saved] = await Promise.all([
          supabase
            .from("download_history")
            .select("resource_id")
            .eq("user_id", userId),

          supabase
            .from("saved_resources")
            .select("resource_id")
            .eq("user_id", userId),
        ]);

        if (downloads.error) throw downloads.error;
        if (saved.error) throw saved.error;

        if (active) {
          // Count unique resources, not repeated downloads
          setDownloadedCount(
            new Set(downloads.data.map((row) => row.resource_id)).size
          );

          setSavedCount(
            new Set(saved.data.map((row) => row.resource_id)).size
          );
        }
      } catch (error) {
        console.error("Failed to load profile statistics:", error);
      } finally {
        if (active) setStatsLoading(false);
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  if (!profile) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">
            Loading profile...
          </p>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="space-y-6">

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-semibold">
            Profile
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            View your SMAReX account information
          </p>
        </div>

        {/* Main Profile Card */}
        <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-stretch">
            {/* Left: Profile Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:w-[38%] lg:shrink-0">

              {/* Profile Initials */}
              <div className="
              w-24
              h-24
              bg-primary
              rounded-full
              flex
              items-center
              justify-center
              text-primary-foreground
              text-3xl
              font-semibold
              flex-shrink-0
            ">
                {getInitials(profile.full_name)}
              </div>

              {/* User Information */}
              <div className="
              flex-1
              text-center
              sm:text-left
            ">

                <div className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                gap-2
                mb-4
              ">
                  <h2 className="text-2xl font-semibold">
                    {profile.full_name}
                  </h2>

                  <Badge variant="secondary">
                    {profile.role === "admin" ? "Admin" : "User"}
                  </Badge>
                </div>

                <div className="
                space-y-3
                text-sm
                text-muted-foreground
              ">

                  {/* Display Name */}
                  <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">
                    <User className="w-4 h-4" />
                    <span>{profile.display_name}</span>
                  </div>

                  {/* Matric Number */}
                  <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">
                    <GraduationCap className="w-4 h-4" />
                    <span>
                      Matric: {profile.matric_number}
                    </span>
                  </div>

                  {/* Kulliyyah */}
                  <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">
                    <BookOpen className="w-4 h-4" />
                    <span>
                      Kulliyyah: {profile.kulliyyah}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>

                  {/* Account Type */}
                  <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">
                    <Shield className="w-4 h-4" />
                    <span>
                      Account type:{" "}
                      {profile.role === "admin"
                        ? "Administrator"
                        : "IIUM User"}
                    </span>
                  </div>

                </div>
              </div>

            </div> {/* End Left: Profile Details */}

            {/* Right: Profile Statistics */}
            <div className="
  grid grid-cols-2 xl:grid-cols-4
  gap-3 lg:flex-1 min-w-0
  border-t lg:border-t-0 lg:border-l
  border-border
  pt-6 lg:pt-0 lg:pl-8
">

              {/* Uploaded */}
              <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
                <BookOpen className="w-5 h-5 text-primary" />
                <p className="text-2xl font-semibold">
                  {resourcesLoading ? "..." : myResources.length}
                </p>
                <p className="text-sm text-muted-foreground">Uploaded</p>
              </div>

              {/* Downloaded */}
              <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
                <Download className="w-5 h-5 text-primary" />
                <p className="text-2xl font-semibold">
                  {statsLoading ? "..." : downloadedCount}
                </p>
                <p className="text-sm text-muted-foreground">Downloaded</p>
              </div>

              {/* Saved */}
              <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
                <Bookmark className="w-5 h-5 text-primary" />
                <p className="text-2xl font-semibold">
                  {statsLoading ? "..." : savedCount}
                </p>
                <p className="text-sm text-muted-foreground">Saved</p>
              </div>

              {/* Reported */}
              <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center">
                <Flag className="w-5 h-5 text-destructive" />
                <p className="text-2xl font-semibold">
                  {reportsLoading ? "..." : myReports.length}
                </p>
                <p className="text-sm text-muted-foreground">Reported</p>
              </div>

            </div> {/* End Right: Profile Statistics */}

          </div> {/* End Main Flex Layout */}
        </div> {/* End Main Profile Card */}

        {/* Uploaded Resources */}
        <div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Your Uploaded Resources
            </h2>

            <Badge variant="secondary">
              {resourcesLoading
                ? "Loading..."
                : resourcesError
                  ? "Unavailable"
                  : `${myResources.length} Uploads`}
            </Badge>
          </div>

          {/* Loading */}
          {resourcesLoading ? (
            <div className="
              text-center
              py-12
              bg-card
              border
              border-border
              rounded-lg
            ">
              <p className="text-muted-foreground">
                Loading your resources...
              </p>
            </div>
          ) : resourcesError ? (

            /* Error */
            <div className="
              text-center
              py-12
              bg-card
              border
              border-border
              rounded-lg
            ">
              <p className="text-red-600 font-medium">
                Failed to load resources
              </p>

              <p className="text-sm text-muted-foreground mt-2">
                {resourcesError}
              </p>
            </div>

          ) : myResources.length === 0 ? (

            /* Empty State */
            <div className="
              text-center
              py-12
              bg-card
              border
              border-border
              rounded-lg
            ">
              <BookOpen className="
                w-12
                h-12
                mx-auto
                mb-4
                text-muted-foreground
              " />

              <p className="text-muted-foreground mb-2">
                No uploaded resources yet
              </p>

              <p className="text-sm text-muted-foreground">
                Share your notes and study materials with the community
              </p>
            </div>

          ) : (

            /* Real Uploaded Resource Cards */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myResources.map((resource) => {
                const security = getSecurityStatus(
                  resource.security_status
                );

                return (
                  <div
                    key={resource.id}
                    className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row h-full">

                      {/* Left: Thumbnail and Resource Information */}
                      <div className="flex flex-1 min-w-0 gap-4 p-5">

                        {/* Resource Thumbnail */}
                        <div className="w-20 h-20 bg-primary/10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                          {resource.thumbnailUrl ? (
                            <img
                              src={resource.thumbnailUrl}
                              alt={`${resource.title} thumbnail`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-8 h-8 text-primary" />
                          )}
                        </div>

                        {/* Resource Information */}
                        <div className="flex-1 min-w-0">

                          {/* Title and Security Status */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg break-words">
                              {resource.title}
                            </h3>

                            <span
                              className={`text-xs font-medium px-2 py-1 border rounded-full ${security.className}`}
                            >
                              {security.label}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-3 break-words">
                            {resource.description}
                          </p>

                          {/* Metadata */}
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {resource.kulliyyah}
                            </span>

                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {resource.subject_code}
                            </span>

                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3.5 h-3.5" />
                              {formatFileSize(resource.file_size)}
                            </span>

                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {formatDate(resource.created_at)}
                            </span>
                          </div>

                          {/* Tags */}
                          {resource.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {resource.tags.map((tag, index) => (
                                <Badge
                                  key={`${resource.id}-${index}`}
                                  variant="outline"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* File Name */}
                          <p className="text-xs text-muted-foreground mt-3 break-all">
                            File: {resource.file_name}
                          </p>

                        </div>
                      </div>

                      {/* Right: Full-height See Details Panel */}
                      <Link
                        to={`/resource/${resource.id}`}
                        className="
              group
              flex
              sm:w-32
              shrink-0
              flex-col
              items-center
              justify-center
              gap-3
              p-5
              border-t
              sm:border-t-0
              sm:border-l
              border-border
              bg-muted/30
              hover:bg-primary/10
              transition-colors
            "
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <ArrowUpRight className="w-6 h-6 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>

                        <span className="text-sm font-semibold text-primary text-center">
                          See Details
                        </span>
                      </Link>

                    </div>
                  </div>
                );
              })}
            </div>

          )}

        </div>
        {/* My Reported Resources */}
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Flag className="w-5 h-5 text-destructive" />
          Flagged / Reported Resources
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myReports.map((report) => (
            <div
              key={report.id}
              className="bg-card border border-border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row h-full">

                {/* Left: Report Information */}
                <div className="flex-1 min-w-0 p-5 space-y-3">

                  {/* Resource Title and Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold break-words">
                      {report.resource?.title || "Resource unavailable"}
                    </h3>

                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${report.status === "pending"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : report.status === "reviewed"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}>
                      {report.status === "pending"
                        ? "Pending"
                        : report.status === "reviewed"
                          ? "Reviewed"
                          : "Dismissed"}
                    </span>
                  </div>

                  {/* Resource Metadata */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {report.resource?.kulliyyah || "Unknown"}
                    </span>

                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {report.resource?.subject_code || "Unknown"}
                    </span>
                  </div>

                  {/* Report Reason */}
                  <div className="flex items-start gap-2 text-sm">
                    <Flag className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p>
                      <span className="font-medium">Reason: </span>
                      <span className="text-muted-foreground">
                        {report.reason}
                      </span>
                    </p>
                  </div>

                  {/* Optional Report Description */}
                  {report.description && (
                    <p className="text-sm text-muted-foreground break-words">
                      {report.description}
                    </p>
                  )}

                  {/* Report Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    Reported on {formatDate(report.created_at)}
                  </div>

                </div>

                {/* Right: View Resource Panel */}
                {report.resource ? (
                  <Link
                    to={`/resource/${report.resource_id}`}
                    className="
              group flex sm:w-36 shrink-0 flex-col
              items-center justify-center gap-3
              min-h-28 p-4
              border-t sm:border-t-0 sm:border-l border-border
              bg-muted/30 hover:bg-primary/10
              transition-colors duration-200
            "
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Eye className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    </div>

                    <span className="text-sm font-semibold text-primary text-center">
                      View Resource
                    </span>
                  </Link>
                ) : (
                  <div className="sm:w-36 shrink-0 flex items-center justify-center p-4 border-t sm:border-t-0 sm:border-l border-border bg-muted/20">
                    <span className="text-xs text-muted-foreground text-center">
                      Unavailable
                    </span>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>

      </div>
    </Sidebar>
  );
};

export default Profile;
