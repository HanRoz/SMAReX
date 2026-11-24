import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CircleAlert,
  FileCheck2,
  FileText,
  Files,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import { userAuth } from "../../context/AuthContext";
import { getAdminOverviewData } from "../../services/adminOverviewService";

const INITIAL_DATA = {
  totalUsers: 0,
  totalResources: 0,
  pendingReports: 0,
  pendingResources: 0,
  rejectedUploads: 0,
  recentRejectedUploads: [],
  recentResources: [],
};

function formatDate(value, includeTime = false) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? { hour: "numeric", minute: "2-digit", hour12: true }
      : {}),
  });
}

function getInitials(name) {
  if (!name?.trim()) return "AD";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SecurityBadge({ status }) {
  const styles = {
    safe: "border-green-200 bg-green-50 text-green-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    suspicious: "border-orange-200 bg-orange-50 text-orange-700",
    malicious: "border-red-200 bg-red-50 text-red-700",
  };

  const labels = {
    safe: "Safe",
    pending: "Pending",
    suspicious: "Suspicious",
    malicious: "Malicious",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || styles.pending
        }`}
    >
      {status === "safe" ? (
        <ShieldCheck className="size-3.5" />
      ) : (
        <ShieldAlert className="size-3.5" />
      )}

      {labels[status] || "Unknown"}
    </span>
  );
}

export default function AdminOverview() {
  const { profile, session } = userAuth();

  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const adminName =
    profile?.full_name ||
    profile?.display_name ||
    session?.user?.email ||
    "Administrator";

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");

      const result = await getAdminOverviewData();
      setData(result);
    } catch (err) {
      console.error("Admin overview error:", err);
      setError(err.message || "Failed to load overview data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const stats = [
    {
      label: "Total Users",
      value: data.totalUsers,
      icon: Users,
      tone: "bg-[#E8F1FA] text-[#003580]",
    },
    {
      label: "Total Resources",
      value: data.totalResources,
      icon: FileText,
      tone: "bg-[#EEF2FF] text-[#4338CA]",
    },
    {
      label: "Pending Reports",
      value: data.pendingReports,
      icon: CircleAlert,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Resources Awaiting Review",
      value: data.pendingResources,
      icon: Files,
      tone: "bg-[#E8F1FA] text-[#003580]",
    },
    {
      label: "Rejected Uploads",
      value: data.rejectedUploads,
      icon: ShieldAlert,
      tone: "bg-red-50 text-red-700",
      description: "Threat-detected attempts",
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">

      {/* Header */}
      <section className="flex flex-col justify-between gap-5 border-b border-[#DDE4EC] pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#003580]">
            Administration
          </p>

          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-[#142033] sm:text-[34px]">
            Admin Overview
          </h1>

          <p className="mt-2 text-[15px] text-[#64748B]">
            Monitor SMAReX platform activity and academic resources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadOverview}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-[10px] border border-[#DDE4EC] bg-white px-3.5 py-2.5 text-sm font-medium text-[#475569] shadow-sm hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <div className="hidden items-center gap-2 rounded-[10px] border border-[#DDE4EC] bg-white px-3.5 py-2.5 text-sm text-[#475569] shadow-sm sm:flex">
            <CalendarDays className="size-4 text-[#003580]" />
            {new Date().toLocaleDateString("en-MY", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>

          <div
            className="grid size-10 place-items-center rounded-full bg-[#003580] text-xs font-bold text-white shadow-sm"
            title={adminName}
          >
            {getInitials(adminName)}
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Failed to load admin data: {error}</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
        aria-label="Platform summary"
      >
        {stats.map(({ label, value, icon: Icon, tone, description }) => (
          <article
            key={label}
            className="rounded-[10px] border border-[#DDE4EC] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">
                  {label}
                </p>

                <p className="mt-2 font-mono text-[28px] font-medium tracking-[-0.04em] text-[#142033]">
                  {loading || error
                    ? "—"
                    : typeof value === "number"
                      ? value.toLocaleString("en-MY")
                      : value}
                </p>

                {description && (
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    {description}
                  </p>
                )}
              </div>

              <div
                className={`grid size-10 place-items-center rounded-[10px] ${tone}`}
              >
                <Icon className="size-[19px]" />
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Rejected Upload Attempts */}
      <section className="overflow-hidden rounded-[10px] border border-[#DDE4EC] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-3 border-b border-[#E5EAF0] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-[18px] text-red-600" />

              <h2 className="text-[17px] font-bold tracking-[-0.015em] text-[#142033]">
                Rejected Upload Attempts
              </h2>
            </div>

            <p className="mt-1.5 text-sm text-[#64748B]">
              Latest files rejected due to detected security threats.
            </p>
          </div>

          <Link
            to="/admin/rejected-uploads"
            className="shrink-0 text-sm font-semibold text-[#003580] hover:underline"
          >
            View all rejected uploads &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-[#64748B]">
            Loading rejected uploads...
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm text-red-600">
            Unable to load rejected uploads.
          </div>
        ) : data.recentRejectedUploads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#F8FAFC]">
                <tr className="border-b border-[#E5EAF0]">
                  {[
                    "File Name",
                    "Uploader",
                    "Attempt Date",
                    "Security Status",
                    "Detections",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EDF1F5]">
                {data.recentRejectedUploads.map((upload) => (
                  <tr
                    key={upload.id}
                    className="hover:bg-[#F8FBFE]"
                  >
                    {/* File name and type */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                          <FileText className="size-4" />
                        </div>

                        <div className="min-w-0">
                          <p
                            title={upload.file_name}
                            className="max-w-[220px] truncate text-sm font-semibold text-[#1E293B]"
                          >
                            {upload.file_name}
                          </p>

                          <p className="mt-0.5 text-xs uppercase text-[#64748B]">
                            {upload.file_type}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Uploader */}
                    <td className="px-6 py-3.5 text-sm text-[#475569]">
                      {upload.uploader}
                    </td>

                    {/* Attempt date */}
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-[#475569]">
                      {formatDate(upload.created_at, true)}
                    </td>

                    {/* Security status */}
                    <td className="px-6 py-3.5">
                      <SecurityBadge status={upload.security_status} />
                    </td>

                    {/* Detection counts */}
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <p
                        className={`text-sm font-semibold ${upload.security_status === "malicious"
                          ? "text-red-700"
                          : "text-orange-700"
                          }`}
                      >
                        {upload.malicious_count + upload.suspicious_count}
                        {" / "}
                        {upload.total_engines}
                      </p>

                      <p className="mt-0.5 text-xs text-[#64748B]">
                        {upload.malicious_count} malicious,
                        {" "}
                        {upload.suspicious_count} suspicious
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-green-50 text-green-600">
              <ShieldCheck className="size-5" />
            </div>

            <p className="mt-4 text-sm font-bold text-[#142033]">
              No rejected uploads recorded
            </p>

            <p className="mt-1 max-w-md text-sm text-[#64748B]">
              Upload attempts rejected due to malicious or suspicious
              VirusTotal detections will appear here.
            </p>
          </div>
        )}
      </section>


      {/* Recent Uploaded Resources */}
      <section className="overflow-hidden rounded-[10px] border border-[#DDE4EC] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.045)]">
        <div className="flex items-center justify-between border-b border-[#E5EAF0] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.015em] text-[#142033]">
              Recent Uploaded Resources
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Latest academic resources uploaded to SMAReX.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-[#64748B]">
            Loading recent resources...
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm text-red-600">
            Unable to load recent resources.
          </div>
        ) : data.recentResources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-[#F8FAFC]">
                <tr className="border-b border-[#E5EAF0]">
                  {[
                    "Resource Title",
                    "Uploader",
                    "Upload Date",
                    "Security Status",
                    "",
                  ].map((heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EDF1F5]">
                {data.recentResources.map((resource) => (
                  <tr
                    key={resource.id}
                    className="hover:bg-[#F8FBFE]"
                  >
                    <td className="px-6 py-3.5 text-sm font-semibold text-[#1E293B]">
                      {resource.title}
                    </td>

                    <td className="px-6 py-3.5 text-sm text-[#475569]">
                      {resource.uploader}
                    </td>

                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-[#475569]">
                      {formatDate(resource.created_at, true)}
                    </td>

                    <td className="px-6 py-3.5">
                      <SecurityBadge
                        status={resource.security_status}
                      />
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/resource/${resource.id}`}
                        className="text-sm font-semibold text-[#003580] hover:underline"
                      >
                        View resource
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <FileCheck2 className="size-7 text-[#7A889C]" />

            <p className="mt-3 text-sm font-bold text-[#142033]">
              No recent resources
            </p>

            <p className="mt-1 text-sm text-[#64748B]">
              Uploaded academic resources will appear here.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
