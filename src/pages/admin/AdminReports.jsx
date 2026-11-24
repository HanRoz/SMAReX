import { useEffect, useMemo, useState } from "react";
import {
  getAdminReportedResources,
  dismissAdminResourceReports,
  deleteAdminReportedResource,
} from "../../services/adminReportService";
import {
  Calendar,
  CheckCircle2,
  Eye,
  FileSearch,
  FileText,
  Flag,
  GraduationCap,
  Search,
  Trash2,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../assets/ui/dialog";

import { Link } from "react-router-dom";

function formatDate(date) {
  if (!date) return "N/A";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "N/A";
  return value.toLocaleString("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  });
}

function StatusBadge({ status }) {
  const styles = {
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Dismissed: "border-slate-200 bg-slate-100 text-slate-600",
    Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || styles.Pending}`}>
      <span className={`size-1.5 rounded-full ${status === "Pending" ? "bg-amber-500" : status === "Resolved" ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status}
    </span>
  );
}

export default function AdminReports() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Pending");
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [moderating, setModerating] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadReports() {
      try {
        const data = await getAdminReportedResources();
        if (active) setResources(data);
      } catch (error) {
        console.error("Failed to load admin reports:", error);
        if (active) {
          setLoadError(error.message || "Unable to load reports.");
          toast.error("Failed to load reported materials.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReports();
    return () => { active = false; };
  }, []);

  const selected = resources.find((resource) => resource.id === selectedId) ?? null;
  // const pendingCount = resources.filter((resource) => resource.status === "Pending").length;
  // Number of resources containing at least one pending report
  const pendingResourceCount = resources.filter(
    (resource) =>
      resource.reports.some(
        (report) => report.status === "Pending"
      )
  ).length;

  // Total number of individual pending reports
  const pendingReportCount = resources.reduce(
    (total, resource) =>
      total +
      resource.reports.filter(
        (report) => report.status === "Pending"
      ).length,
    0
  );

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    const results = resources.filter(
      (resource) =>
        (tab === "All" || resource.status === tab) &&
        (resource.title.toLowerCase().includes(needle) || resource.uploader.toLowerCase().includes(needle)),
    );
    return [...results].sort((a, b) => sortNewest
      ? new Date(b.latestDate) - new Date(a.latestDate)
      : new Date(a.latestDate) - new Date(b.latestDate));
  }, [query, resources, sortNewest, tab]);

  const handleDismissReports = async () => {
    if (!selected || moderating) return;

    const confirmed = window.confirm(
      `Dismiss all pending reports for "${selected.title}"?\n\nThe resource will remain available in SMAReX.`
    );

    if (!confirmed) return;

    try {
      setModerating(true);

      const updatedCount = await dismissAdminResourceReports(selected.id);

      const updatedResources = await getAdminReportedResources();
      setResources(updatedResources);
      setSelectedId(null);

      toast.success(
        `${updatedCount} pending report(s) dismissed successfully.`
      );
    } catch (err) {
      console.error("Dismiss reports error:", err);
      toast.error(err.message || "Failed to dismiss reports.");
    } finally {
      setModerating(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!selected || deleting) return;

    const reason = deleteReason.trim();

    if (reason.length < 10 || reason.length > 500) {
      toast.error(
        "Please enter a moderation reason between 10 and 500 characters."
      );
      return;
    }

    try {
      setDeleting(true);

      await deleteAdminReportedResource(selected.id, reason);

      // Reload actual reports after deletion.
      const updatedResources = await getAdminReportedResources();
      setResources(updatedResources);

      setDeleteConfirmOpen(false);
      setSelectedId(null);
      setDeleteReason("");

      toast.success(
        "Resource deleted. Moderation history has been preserved."
      );
    } catch (error) {
      console.error("Admin deletion failed:", error);

      toast.error(
        error.message || "Failed to delete the resource."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <section className="flex flex-col justify-between gap-5 border-b border-[#DDE4EC] pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#003580]">Content moderation</p>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-[#142033] sm:text-[34px]">Reported Materials</h1>
          <p className="mt-2 text-[15px] text-[#64748B]">Review reported resources and take moderation action.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Individual pending reports */}
          <div className="flex items-center gap-3 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <Flag className="size-[18px]" />

            <div>
              <p className="font-mono text-lg font-medium leading-none">
                {pendingReportCount}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em]">
                Pending Reports
              </p>
            </div>
          </div>

          {/* Resources with pending reports */}
          <div className="flex items-center gap-3 rounded-[10px] border border-[#D7E0E9] bg-white px-4 py-3 text-[#003580]">
            <FileText className="size-[18px]" />

            <div>
              <p className="font-mono text-lg font-medium leading-none">
                {pendingResourceCount}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em]">
                Reported Resources
              </p>
            </div>
          </div>
        </div>

      </section>

      <section className="overflow-hidden rounded-[10px] border border-[#DDE4EC] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.045)]">
        <div className="border-b border-[#E5EAF0] p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative block w-full xl:max-w-[390px]">
              <span className="sr-only">Search reported materials</span>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7A889C]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search resource title or uploader"
                className="h-10 w-full rounded-[9px] border border-[#CCD6E2] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/10"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex max-w-full overflow-x-auto rounded-[9px] border border-[#D7E0E9] bg-[#F8FAFC] p-1">
                {["Pending", "Dismissed", "Resolved", "All"].map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setTab(status)}
                    className={`whitespace-nowrap rounded-[7px] px-3.5 py-2 text-xs font-bold transition ${tab === status ? "bg-[#003580] text-white shadow-sm" : "text-[#64748B] hover:text-[#003580]"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSortNewest((current) => !current)}
                className="h-10 rounded-[9px] border border-[#CCD6E2] bg-white px-3 text-sm font-medium text-[#334155] transition hover:bg-[#F5F7FA]"
              >
                {sortNewest ? "Most recently reported" : "Oldest reported"}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-[#64748B]">Loading reported materials...</div>
        ) : loadError ? (
          <div className="px-6 py-16 text-center text-sm text-red-700">{loadError}</div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#F8FAFC]">
                <tr className="border-b border-[#E5EAF0]">
                  {["Reported Resource", "Kulliyyah", "Reports", "Most Recent", "Status", "Action"].map((heading) => (
                    <th key={heading} className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1F5]">
                {filtered.map((resource) => (
                  <tr key={resource.id} className="transition-colors hover:bg-[#F8FBFE]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#E8F1FA] text-[#003580]">
                          <FileText className="size-4" />
                        </span>
                        <div>
                          <p className="max-w-[340px] truncate text-sm font-semibold text-[#1E293B]">{resource.title}</p>
                          <p className="mt-0.5 text-xs text-[#7A889C]">{resource.uploader}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-[#EEF2F6] px-2 py-1 text-xs font-bold text-[#475569]">{resource.kulliyyah}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#334155]">
                        <Flag className="size-3.5 text-red-500" />
                        {resource.reports.length} {resource.reports.length === 1 ? "Report" : "Reports"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#475569]">{formatDate(resource.latestDate)}</td>
                    <td className="px-6 py-4"><StatusBadge status={resource.status} /></td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedId(resource.id)}
                        className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#BFCBDA] px-3 text-sm font-bold text-[#003580] transition hover:border-[#003580] hover:bg-[#E8F1FA]"
                      >
                        <Eye className="size-4" /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[#E8F1FA] text-[#003580]">
              {query ? <Search className="size-6" /> : tab === "Pending" ? <CheckCircle2 className="size-6" /> : <FileSearch className="size-6" />}
            </div>
            <h2 className="mt-4 text-base font-bold text-[#142033]">
              {query ? "No matching reports" : tab === "Pending" ? "No pending reports" : `No ${tab.toLowerCase()} reports`}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-[#64748B]">
              {query ? "Try a different resource title or uploader name." : "There are no resources in this moderation state."}
            </p>
          </div>
        )}
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-[#D7E0E9] bg-white p-0 sm:max-w-[760px]">
          {selected && (
            <>
              <DialogHeader className="border-b border-[#E5EAF0] px-6 py-5 pr-12">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#003580]">Moderation review</p>
                <DialogTitle className="text-xl font-bold leading-snug tracking-[-0.02em] text-[#142033]">{selected.title}</DialogTitle>
                <DialogDescription className="text-sm text-[#64748B]">
                  {selected.reports.length} reports grouped under this resource.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 px-6 py-6">
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#64748B]">Resource information</h3>
                  <div className="mt-3 rounded-[10px] border border-[#E1E7EE] bg-[#F8FAFC] p-4">
                    <p className="text-sm leading-6 text-[#475569]">{selected.description}</p>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <p className="flex items-center gap-2 text-[#475569]"><User className="size-4 text-[#003580]" /> {selected.uploader}</p>
                      <p className="flex items-center gap-2 text-[#475569]"><GraduationCap className="size-4 text-[#003580]" /> {selected.kulliyyah}</p>
                      <p className="flex items-center gap-2 text-[#475569]"><Calendar className="size-4 text-[#003580]" /> Uploaded {formatDate(selected.uploadDate)}</p>
                      <p className="flex items-center gap-2 font-semibold text-emerald-700"><ShieldCheck className="size-4" /> Security status: {selected.securityStatus || "Unknown"}</p>
                    </div>
                    <Link
                      to={`/resource/${selected.id}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#003580] hover:underline"
                    >
                      <Eye className="size-4" />
                      View resource
                    </Link>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#64748B]">User reports</h3>
                    <span className="text-xs font-semibold text-[#64748B]">{selected.reports.length} total</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {selected.reports.map((report, index) => (
                      <article key={`${report.reporter}-${index}`} className="rounded-[10px] border border-[#E1E7EE] p-4">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div>
                            <p className="text-sm font-bold text-[#27364A]">{report.reporter}</p>
                            <p className="mt-1 text-sm font-semibold text-red-700">{report.reason}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#7A889C]">{formatDate(report.date)}</span>
                            <StatusBadge status={report.status} />
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#64748B]">{report.description}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-[#E5EAF0] bg-white px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="h-10 rounded-[9px] border border-[#CBD5E1] px-4 text-sm font-bold text-[#475569] hover:bg-[#F5F7FA]"
                >
                  Cancel
                </button>
                {selected.status === "Pending" && (
                  <button
                    type="button"
                    onClick={handleDismissReports}
                    disabled={moderating}
                    className="h-10 rounded-[9px] border border-[#BFCBDA] px-4 text-sm font-bold text-[#003580] transition hover:bg-[#E8F1FA] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {moderating ? "Processing..." : "Dismiss Reports"}
                  </button>
                )}
                {/* <button
                  type="button"
                  disabled
                  title="Moderation action will be connected to Supabase next"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-red-600 px-4 text-sm font-bold text-white opacity-50 cursor-not-allowed"
                >
                  <Trash2 className="size-4" /> Delete Resource
                </button> */}
                <button
                  type="button"
                  onClick={() => {
                    setDeleteReason("");
                    setDeleteConfirmOpen(true);
                  }}
                  disabled={deleting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  Delete Resource
                </button>


                <Dialog
                  open={deleteConfirmOpen}
                  onOpenChange={(open) => {
                    if (deleting) return;

                    setDeleteConfirmOpen(open);

                    if (!open) {
                      setDeleteReason("");
                    }
                  }}
                >
                  <DialogContent className="border-[#D7E0E9] bg-white sm:max-w-[520px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-xl font-bold text-red-700">
                        <Trash2 className="size-5" />
                        Delete Reported Resource
                      </DialogTitle>

                      <DialogDescription className="text-sm text-[#64748B]">
                        This action permanently removes the resource and its
                        uploaded files. The moderation history will be preserved.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-800">
                          Resource: {selected?.title || "Unknown"}
                        </p>

                        <p className="mt-2 text-xs text-red-700">
                          This action cannot be undone. The resource will no
                          longer be available to SMAReX users.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="moderation-reason"
                          className="block text-sm font-semibold text-[#334155]"
                        >
                          Reason for deletion
                        </label>

                        <textarea
                          id="moderation-reason"
                          value={deleteReason}
                          onChange={(event) =>
                            setDeleteReason(event.target.value)
                          }
                          maxLength={500}
                          rows={4}
                          disabled={deleting}
                          placeholder="Explain why this resource violates SMAReX policies..."
                          className="w-full resize-none rounded-lg border border-[#CBD5E1] p-3 text-sm outline-none focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/10"
                        />

                        <p className="text-right text-xs text-[#64748B]">
                          {deleteReason.length}/500 characters
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmOpen(false)}
                        disabled={deleting}
                        className="h-10 rounded-lg border border-[#CBD5E1] px-4 text-sm font-semibold text-[#475569] hover:bg-[#F5F7FA] disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteResource}
                        disabled={
                          deleting ||
                          deleteReason.trim().length < 10 ||
                          deleteReason.trim().length > 500
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                        {deleting ? "Deleting..." : "Confirm Deletion"}
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
