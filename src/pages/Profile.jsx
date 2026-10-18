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
} from "lucide-react";

import {
  getMyResources,
  getThumbnailUrl,
} from "../services/resourceService";
import { userAuth } from "../context/AuthContext";
import { Badge } from "../assets/ui/badge";
import { Sidebar } from "../components/sidebar";

const Profile = () => {
  const { profile } = userAuth();

  const [myResources, setMyResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState("");

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
        <div className="
          bg-card
          border
          border-border
          rounded-lg
          p-8
          shadow-sm
        ">
          <div className="
            flex
            flex-col
            sm:flex-row
            items-center
            sm:items-start
            gap-6
          ">

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
          </div>
        </div>

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
            <div className="space-y-4">
              {myResources.map((resource) => {
                const security = getSecurityStatus(
                  resource.security_status
                );

                return (
                  <div
                    key={resource.id}
                    className="
                      bg-card
                      border
                      border-border
                      rounded-lg
                      p-5
                      shadow-sm
                    "
                  >
                    <div className="
                      flex
                      flex-col
                      sm:flex-row
                      sm:items-start
                      gap-4
                    ">

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

                        <div className="
                          flex
                          flex-wrap
                          items-center
                          gap-2
                          mb-2
                        ">
                          <h3 className="font-semibold text-lg break-words">
                            {resource.title}
                          </h3>

                          <span className={`
                            text-xs
                            font-medium
                            px-2
                            py-1
                            border
                            rounded-full
                            ${security.className}
                          `}>
                            {security.label}
                          </span>
                        </div>

                        <p className="
                          text-sm
                          text-muted-foreground
                          mb-3
                          break-words
                        ">
                          {resource.description}
                        </p>

                        <div className="
                          flex
                          flex-wrap
                          gap-x-4
                          gap-y-2
                          text-xs
                          text-muted-foreground
                        ">
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

                        <p className="
                          text-xs
                          text-muted-foreground
                          mt-3
                          break-all
                        ">
                          File: {resource.file_name}
                        </p>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          )}

        </div>

      </div>
    </Sidebar>
  );
};

export default Profile;
