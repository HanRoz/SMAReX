
import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Copy,
    ExternalLink,
    Eye,
    FileText,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    ShieldX,
} from "lucide-react";

import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../assets/ui/dialog";

import { getRejectedUploads } from "../../services/adminRejectedUploadService";

// Format the upload attempt date.
function formatDate(value) {
    if (!value) return "Unknown date";

    return new Date(value).toLocaleString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

// Display the security classification.
function SecurityBadge({ status }) {
    const isMalicious = status === "malicious";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${isMalicious
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-orange-200 bg-orange-50 text-orange-700"
                }`}
        >
            <ShieldAlert className="size-3.5" />
            {isMalicious ? "Malicious" : "Suspicious"}
        </span>
    );
}

// Format file size into readable units.
function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "Unknown";

    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Construct a trusted VirusTotal report URL.
function getVirusTotalReportUrl(sha256) {
    if (
        typeof sha256 !== "string" ||
        !/^[a-fA-F0-9]{64}$/.test(sha256)
    ) {
        return null;
    }

    return `https://www.virustotal.com/gui/file/${sha256.toLowerCase()}`;
}

export default function AdminRejectedUploads() {
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortNewest, setSortNewest] = useState(true);

    const selected =
        uploads.find((upload) => upload.id === selectedId) ?? null;

    const reportUrl = getVirusTotalReportUrl(
        selected?.file_sha256
    );

    const isSimulatedTest =
        selected?.rejection_reason?.startsWith("SIMULATED TEST") ?? false;

    // Copy the selected file hash.
    async function handleCopyHash() {
        if (!selected?.file_sha256) return;

        try {
            await navigator.clipboard.writeText(
                selected.file_sha256
            );

            toast.success("SHA-256 hash copied to clipboard.");
        } catch (error) {
            console.error("Failed to copy hash:", error);
            toast.error("Unable to copy SHA-256 hash.");
        }
    }

    // Retrieve rejected upload records.
    async function loadRejectedUploads() {
        try {
            setLoading(true);
            setError("");

            const result = await getRejectedUploads();
            setUploads(result);
        } catch (err) {
            console.error("Rejected uploads error:", err);

            setError(
                err.message || "Failed to load rejected uploads."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRejectedUploads();
    }, []);

    // Search, filter and sort rejected upload records.
    const filteredUploads = useMemo(() => {
        const needle = query.trim().toLowerCase();

        const results = uploads.filter((upload) => {
            // Filter by security classification.
            const matchesStatus =
                statusFilter === "all" ||
                upload.security_status === statusFilter;

            // Search across file and uploader information.
            const searchableFields = [
                upload.file_name,
                upload.file_type,
                upload.uploader,
                upload.uploaderMatric,
                upload.uploaderKulliyyah,
                upload.file_sha256,
            ];

            const matchesQuery =
                !needle ||
                searchableFields.some((value) =>
                    String(value ?? "")
                        .toLowerCase()
                        .includes(needle)
                );

            return matchesStatus && matchesQuery;
        });

        // Sort without modifying the original uploads array.
        return [...results].sort((a, b) => {
            const dateDifference = sortNewest
                ? new Date(b.created_at) - new Date(a.created_at)
                : new Date(a.created_at) - new Date(b.created_at);

            return dateDifference || (
                sortNewest
                    ? b.id.localeCompare(a.id)
                    : a.id.localeCompare(b.id)
            );
        });
    }, [uploads, query, statusFilter, sortNewest]);

    // Determine whether search or status filters are active.
    const hasActiveFilters =
        query.trim() !== "" || statusFilter !== "all";

    // Reset search and security status filters.
    function clearFilters() {
        setQuery("");
        setStatusFilter("all");
    }

    // Calculate summary statistics.
    const maliciousUploads = uploads.filter(
        (upload) => upload.security_status === "malicious"
    ).length;

    const suspiciousUploads = uploads.filter(
        (upload) => upload.security_status === "suspicious"
    ).length;

    const stats = [
        {
            label: "Total Rejected Uploads",
            value: uploads.length,
            icon: ShieldAlert,
            tone: "bg-[#E8F1FA] text-[#003580]",
        },
        {
            label: "Malicious Uploads",
            value: maliciousUploads,
            icon: ShieldX,
            tone: "bg-red-50 text-red-700",
        },
        {
            label: "Suspicious Uploads",
            value: suspiciousUploads,
            icon: AlertTriangle,
            tone: "bg-orange-50 text-orange-700",
        },
    ];

    return (
        <div className="mx-auto max-w-[1440px] space-y-7">
            {/* Header */}
            <section className="flex flex-col justify-between gap-5 border-b border-[#DDE4EC] pb-7 sm:flex-row sm:items-end">
                <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#003580]">
                        Administration / Security
                    </p>

                    <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-[#142033] sm:text-[34px]">
                        Rejected Uploads
                    </h1>

                    <p className="mt-2 text-[15px] text-[#64748B]">
                        Monitor and investigate upload attempts rejected
                        due to detected security threats.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadRejectedUploads}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#DDE4EC] bg-white px-3.5 py-2.5 text-sm font-medium text-[#475569] shadow-sm hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                    <RefreshCw
                        className={`size-4 ${loading ? "animate-spin" : ""
                            }`}
                    />
                    Refresh
                </button>
            </section>

            {/* Error message */}
            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Summary statistics */}
            <section
                className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                aria-label="Rejected uploads summary"
            >
                {stats.map(({ label, value, icon: Icon, tone }) => (
                    <article
                        key={label}
                        className="rounded-[10px] border border-[#DDE4EC] bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-[#64748B]">
                                    {label}
                                </p>

                                <p className="mt-2 font-mono text-[28px] font-medium tracking-[-0.04em] text-[#142033]">
                                    {loading || error
                                        ? "—"
                                        : value.toLocaleString("en-MY")}
                                </p>
                            </div>

                            <div
                                className={`grid size-10 shrink-0 place-items-center rounded-[10px] ${tone}`}
                            >
                                <Icon className="size-[19px]" />
                            </div>
                        </div>
                    </article>
                ))}
            </section>

            {/* Rejected upload records */}
            <section className="overflow-hidden rounded-[10px] border border-[#DDE4EC] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.045)]">

                <div className="border-b border-[#E5EAF0] px-5 py-5 sm:px-6">
                    <h2 className="text-[17px] font-bold tracking-[-0.015em] text-[#142033]">
                        Rejected Upload History
                    </h2>

                    <p className="mt-1.5 text-sm text-[#64748B]">
                        Recorded upload attempts with malicious or
                        suspicious VirusTotal detections.
                    </p>

                    {/* Search, filter and sorting controls */}
                    <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                        {/* Search input */}
                        <label className="relative block w-full xl:max-w-[390px]">
                            <span className="sr-only">
                                Search rejected uploads
                            </span>

                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7A889C]" />

                            <input
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search file name, uploader or SHA-256"
                                className="h-10 w-full rounded-[9px] border border-[#CCD6E2] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/10"
                            />
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                            {/* Security status filters */}
                            <div
                                className="flex max-w-full overflow-x-auto rounded-[9px] border border-[#D7E0E9] bg-[#F8FAFC] p-1"
                                role="group"
                                aria-label="Filter by security status"
                            >
                                {[
                                    { label: "All", value: "all" },
                                    { label: "Malicious", value: "malicious" },
                                    { label: "Suspicious", value: "suspicious" },
                                ].map(({ label, value }) => (
                                    <button
                                        type="button"
                                        key={value}
                                        onClick={() => setStatusFilter(value)}
                                        aria-pressed={statusFilter === value}
                                        className={`whitespace-nowrap rounded-[7px] px-3.5 py-2 text-xs font-bold transition ${statusFilter === value
                                            ? "bg-[#003580] text-white shadow-sm"
                                            : "text-[#64748B] hover:text-[#003580]"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Sort order */}
                            <button
                                type="button"
                                onClick={() =>
                                    setSortNewest((current) => !current)
                                }
                                className="h-10 whitespace-nowrap rounded-[9px] border border-[#CCD6E2] bg-white px-3 text-sm font-medium text-[#334155] transition hover:bg-[#F5F7FA]"
                            >
                                {sortNewest ? "Newest first" : "Oldest first"}
                            </button>

                            {/* Clear filters */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="whitespace-nowrap text-sm font-semibold text-[#003580] hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>


                {loading ? (
                    <div className="px-6 py-14 text-center text-sm text-[#64748B]">
                        Loading rejected uploads...
                    </div>
                ) : error ? (
                    <div className="px-6 py-14 text-center text-sm text-red-600">
                        Unable to load rejected upload records.
                    </div>
                ) : filteredUploads.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            {/* <table className="w-full min-w-[900px] text-left"> */}
                            <table className="w-full min-w-[1100px] text-left">
                                <thead className="bg-[#F8FAFC]">
                                    <tr className="border-b border-[#E5EAF0]">
                                        {[
                                            "File Information",
                                            "Uploader",
                                            "Attempt Date",
                                            "Security Status",
                                            "Detections",
                                            "Action",
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                scope="col"
                                                className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]"
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#EDF1F5]">
                                    {filteredUploads.map((upload) => (
                                        <tr
                                            key={upload.id}
                                            className="hover:bg-[#F8FBFE]"
                                        >
                                            {/* File information */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                                                        <FileText className="size-5" />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p
                                                            title={upload.file_name}
                                                            className="max-w-[240px] truncate text-sm font-semibold text-[#1E293B]"
                                                        >
                                                            {upload.file_name}
                                                        </p>

                                                        <p className="mt-1 text-xs text-[#64748B]">
                                                            {upload.file_type.toUpperCase()}
                                                            {" · "}
                                                            {formatFileSize(upload.file_size)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Uploader */}
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-[#475569]">
                                                    {upload.uploader}
                                                </p>

                                                {upload.uploaderMatric && (
                                                    <p className="mt-1 text-xs text-[#64748B]">
                                                        {upload.uploaderMatric}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Attempt date */}
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-[#475569]">
                                                {formatDate(upload.created_at)}
                                            </td>

                                            {/* Security status */}
                                            <td className="px-6 py-4">
                                                <SecurityBadge
                                                    status={upload.security_status}
                                                />
                                            </td>

                                            {/* Detection counts */}
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <p
                                                    className={`text-sm font-semibold ${upload.security_status === "malicious"
                                                        ? "text-red-700"
                                                        : "text-orange-700"
                                                        }`}
                                                >
                                                    {upload.detectionCount}
                                                    {" / "}
                                                    {upload.total_engines}
                                                </p>

                                                <p className="mt-1 text-xs text-[#64748B]">
                                                    {upload.malicious_count} malicious,
                                                    {" "}
                                                    {upload.suspicious_count} suspicious
                                                </p>
                                            </td>
                                            {/* Action */}
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedId(upload.id)}
                                                    className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#BFCBDA] px-3 text-sm font-bold text-[#003580] transition hover:border-[#003580] hover:bg-[#E8F1FA]"
                                                >
                                                    <Eye className="size-4" />
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Table footer */}
                        <div
                            className="border-t border-[#E5EAF0] px-6 py-4 text-xs text-[#64748B]"
                            aria-live="polite"
                        >
                            Showing {filteredUploads.length} of {uploads.length}{" "}
                            rejected upload{" "}
                            {uploads.length === 1 ? "record" : "records"}
                        </div>
                    </>

                ) : (
                    <div className="flex flex-col items-center px-6 py-16 text-center">

                        {/* Empty state icon */}
                        <div
                            className={`grid size-14 place-items-center rounded-full ${uploads.length > 0
                                    ? "bg-[#E8F1FA] text-[#003580]"
                                    : "bg-green-50 text-green-600"
                                }`}
                        >
                            {uploads.length > 0 ? (
                                <Search className="size-6" />
                            ) : (
                                <ShieldCheck className="size-6" />
                            )}
                        </div>

                        {/* Empty state title */}
                        <p className="mt-4 text-sm font-bold text-[#142033]">
                            {uploads.length > 0
                                ? "No matching rejected uploads"
                                : "No rejected uploads recorded"}
                        </p>

                        {/* Empty state description */}
                        <p className="mt-1.5 max-w-md text-sm text-[#64748B]">
                            {uploads.length > 0
                                ? "Try a different search term or security status."
                                : "Upload attempts rejected due to malicious or suspicious detections will appear here."}
                        </p>

                        {/* Clear filters */}
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 inline-flex h-9 items-center justify-center rounded-[8px] border border-[#BFCBDA] px-4 text-sm font-semibold text-[#003580] transition hover:bg-[#E8F1FA]"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

            </section>

            {/* Security audit information */}
            <div className="flex items-start gap-3 rounded-[10px] border border-[#DDE4EC] bg-[#F8FAFC] p-4">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[#003580]" />

                <div>
                    <p className="text-sm font-semibold text-[#142033]">
                        Security audit records
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
                        Rejected upload records are read-only for administrators
                        to preserve audit integrity. VirusTotal detections
                        indicate potential file security threats and do not
                        necessarily indicate malicious intent by the uploader.
                    </p>
                </div>
            </div>

            {/* Security Details Dialog */}
            <Dialog
                open={Boolean(selected)}
                onOpenChange={(open) => {
                    if (!open) setSelectedId(null);
                }}
            >
                <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto border-[#D7E0E9] bg-white p-0 sm:max-w-[760px]">
                    {selected && (
                        <>
                            {/* Dialog header */}
                            <DialogHeader className="border-b border-[#E5EAF0] px-6 py-5 pr-12">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#003580]">
                                    Security Investigation
                                </p>

                                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-[#142033]">
                                    <ShieldAlert className="size-5 text-red-600" />
                                    Security Details
                                </DialogTitle>

                                <DialogDescription className="text-sm text-[#64748B]">
                                    Review the recorded security information
                                    for this rejected upload attempt.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="min-w-0 space-y-6 px-6 py-6">

                                {/* Simulated test notice */}
                                {isSimulatedTest && (
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                        <AlertTriangle className="size-4 shrink-0" />
                                        This is a simulated test record.
                                        It does not represent an actual
                                        VirusTotal detection.
                                    </div>
                                )}

                                {/* File information */}
                                <section>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#64748B]">
                                        File Information
                                    </h3>

                                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[10px] border border-[#E1E7EE] bg-[#F8FAFC] p-4">
                                        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
                                            <FileText className="size-5" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="break-all text-sm font-bold text-[#142033]">
                                                {selected.file_name}
                                            </p>

                                            <p className="mt-1 text-xs text-[#64748B]">
                                                {selected.file_type.toUpperCase()}
                                                {" · "}
                                                {formatFileSize(selected.file_size)}
                                            </p>
                                        </div>

                                        <SecurityBadge
                                            status={selected.security_status}
                                        />
                                    </div>
                                </section>

                                {/* Detection summary */}
                                <section>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#64748B]">
                                        Detection Summary
                                    </h3>

                                    <div className="mt-3 grid grid-cols-3 gap-3">
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                                            <p className="font-mono text-2xl font-bold text-red-700">
                                                {selected.malicious_count}
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-red-700">
                                                Malicious
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                                            <p className="font-mono text-2xl font-bold text-orange-700">
                                                {selected.suspicious_count}
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-orange-700">
                                                Suspicious
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-[#DDE4EC] bg-[#F8FAFC] p-4 text-center">
                                            <p className="font-mono text-2xl font-bold text-[#334155]">
                                                {selected.total_engines}
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-[#64748B]">
                                                Total Engines
                                            </p>
                                        </div>
                                    </div>

                                    {/* Detection ratio */}
                                    <div className="mt-4">
                                        <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                                            <span className="text-[#64748B]">
                                                Threat detections
                                            </span>

                                            <span className="font-semibold text-[#334155]">
                                                {selected.detectionCount}
                                                {" / "}
                                                {selected.total_engines} engines
                                            </span>
                                        </div>

                                        <div className="flex h-2.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                                            <div
                                                className="bg-red-600"
                                                style={{
                                                    width: `${selected.total_engines > 0
                                                        ? (selected.malicious_count /
                                                            selected.total_engines) * 100
                                                        : 0
                                                        }%`,
                                                }}
                                            />

                                            <div
                                                className="bg-orange-500"
                                                style={{
                                                    width: `${selected.total_engines > 0
                                                        ? (selected.suspicious_count /
                                                            selected.total_engines) * 100
                                                        : 0
                                                        }%`,
                                                }}
                                            />
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-[#64748B]">
                                            <span className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-red-600" />
                                                Malicious
                                            </span>

                                            <span className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-orange-500" />
                                                Suspicious
                                            </span>

                                            <span className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-[#E2E8F0]" />
                                                Other results
                                            </span>
                                        </div>
                                    </div>
                                </section>

                                {/* Uploader information */}
                                <section>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#64748B]">
                                        Uploader Information
                                    </h3>

                                    <div className="mt-3 grid gap-4 rounded-[10px] border border-[#E1E7EE] bg-[#F8FAFC] p-4 sm:grid-cols-2">
                                        {[
                                            {
                                                label: "Full Name",
                                                value: selected.uploader,
                                            },
                                            {
                                                label: "Matric Number",
                                                value: selected.uploaderMatric,
                                            },
                                            {
                                                label: "Kulliyyah",
                                                value: selected.uploaderKulliyyah,
                                            },
                                            {
                                                label: "Attempt Date",
                                                value: formatDate(
                                                    selected.created_at
                                                ),
                                            },
                                        ].map(({ label, value }) => (
                                            <div key={label}>
                                                <p className="text-xs font-medium text-[#64748B]">
                                                    {label}
                                                </p>

                                                <p className="mt-1 break-words text-sm font-semibold text-[#334155]">
                                                    {value || "Not available"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* SHA-256 hash */}
                                <section>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#64748B]">
                                        File SHA-256
                                    </h3>

                                    <div className="mt-3 flex items-center gap-3 rounded-[10px] border border-[#E1E7EE] bg-[#F8FAFC] p-4">
                                        <code className="min-w-0 flex-1 select-all break-all text-xs leading-6 text-[#475569]">
                                            {selected.file_sha256 || "Not available"}
                                        </code>

                                        <button
                                            type="button"
                                            onClick={handleCopyHash}
                                            disabled={!selected.file_sha256}
                                            title="Copy SHA-256 hash"
                                            aria-label="Copy SHA-256 hash"
                                            className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#DDE4EC] bg-white text-[#475569] transition hover:bg-[#E8F1FA] hover:text-[#003580] disabled:opacity-50"
                                        >
                                            <Copy className="size-4" />
                                        </button>
                                    </div>
                                </section>

                                {/* Rejection reason */}
                                <section>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#64748B]">
                                        Rejection Reason
                                    </h3>

                                    <div className="mt-3 rounded-[10px] border border-[#E1E7EE] bg-[#F8FAFC] p-4">
                                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#475569]">
                                            {selected.rejection_reason ||
                                                "No rejection reason recorded."}
                                        </p>
                                    </div>
                                </section>

                                {/* Investigation disclaimer */}
                                <div className="flex items-start gap-2 rounded-lg border border-[#DDE4EC] bg-[#F8FAFC] p-3">
                                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#003580]" />

                                    <p className="text-xs leading-relaxed text-[#64748B]">
                                        VirusTotal detections indicate potential
                                        file security threats and do not necessarily
                                        indicate malicious intent by the uploader.
                                        Detection results reflect the recorded scan
                                        and may differ from current VirusTotal results.
                                    </p>
                                </div>
                            </div>

                            {/* Dialog footer */}
                            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-[#E5EAF0] bg-white px-6 py-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedId(null)}
                                    className="h-10 rounded-[9px] border border-[#CBD5E1] px-4 text-sm font-bold text-[#475569] hover:bg-[#F5F7FA]"
                                >
                                    Close
                                </button>

                                {reportUrl && !isSimulatedTest ? (
                                    <a
                                        href={reportUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-[#003580] px-4 text-sm font-bold text-white transition hover:bg-[#00265C]"
                                    >
                                        View VirusTotal Report
                                        <ExternalLink className="size-4" />
                                    </a>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        title={
                                            isSimulatedTest
                                                ? "Simulated test record"
                                                : "Invalid or missing SHA-256 hash"
                                        }
                                        className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-[9px] bg-[#003580] px-4 text-sm font-bold text-white opacity-50"
                                    >
                                        View VirusTotal Report
                                        <ExternalLink className="size-4" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
