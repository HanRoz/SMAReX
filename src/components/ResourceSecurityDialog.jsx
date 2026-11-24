
import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  CheckCircle2,
  Info,
  Copy,
  ExternalLink,
  FileText,
  Code2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../assets/ui/dialog";

const DETECTION_CATEGORIES = [
  { key: "malicious", label: "Malicious", color: "#DC2626" },
  { key: "suspicious", label: "Suspicious", color: "#EA580C" },
  { key: "undetected", label: "Undetected", color: "#64748B" },
  { key: "harmless", label: "Harmless", color: "#16A34A" },
  { key: "type-unsupported", label: "Unsupported type", color: "#D97706" },
  { key: "timeout", label: "Timeout", color: "#94A3B8" },
  { key: "confirmed-timeout", label: "Confirmed timeout", color: "#94A3B8" },
  { key: "failure", label: "Failure", color: "#94A3B8" },
];

function formatFileSize(bytes) {
  if (bytes == null || !Number.isFinite(Number(bytes))) {
    return "Not available";
  }

  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getReportUrl(hash) {
  if (
    typeof hash !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(hash)
  ) {
    return null;
  }

  return `https://www.virustotal.com/gui/file/${hash.toLowerCase()}`;
}

function InformationItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium">
        {value ?? "Not available"}
      </p>
    </div>
  );
}

function SecurityCheck({ title, description, passed }) {
  const Icon = passed ? CheckCircle2 : Info;

  return (
    <div className="flex items-start gap-3">
      <Icon
        className={`mt-0.5 size-5 shrink-0 ${
          passed ? "text-green-600" : "text-slate-400"
        }`}
      />

      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function ResourceSecurityDialog({
  open,
  onOpenChange,
  resource,
}) {
  const [tab, setTab] = useState("overview");

  if (!resource) return null;

  const stats = resource.vt_scan_stats;

  const hasStats =
    stats !== null &&
    typeof stats === "object" &&
    !Array.isArray(stats) &&
    Number.isSafeInteger(stats.malicious) &&
    stats.malicious >= 0 &&
    Number.isSafeInteger(stats.suspicious) &&
    stats.suspicious >= 0 &&
    Object.values(stats).every(
      (value) =>
        Number.isSafeInteger(value) && value >= 0
    );

  const total = hasStats
    ? Object.entries(stats).reduce(
        (sum, [key, value]) =>
          key === "total" ? sum : sum + value,
        0
      )
    : null;

  const malicious = hasStats ? stats.malicious : null;
  const suspicious = hasStats ? stats.suspicious : null;

  const threats = hasStats
    ? malicious + suspicious
    : null;

  const detectionPercentage =
    hasStats && total > 0
      ? ((threats / total) * 100).toFixed(1)
      : null;

  const reportUrl = getReportUrl(resource.file_sha256);

  const isSafe = resource.security_status === "safe";

  const noThreatsDetected =
    isSafe && hasStats && total > 0 && threats === 0;

  const signaturePassed =
    resource.file_signature_validated === true;

  const signatureStatus =
    resource.file_signature_validated === true
      ? "Passed"
      : resource.file_signature_validated === false
        ? "Failed"
        : "Not recorded";

  const knownKeys = new Set(
    DETECTION_CATEGORIES.map((category) => category.key)
  );

  const categories = hasStats
    ? [
        ...DETECTION_CATEGORIES,
        ...Object.keys(stats)
          .filter(
            (key) => key !== "total" && !knownKeys.has(key)
          )
          .map((key) => ({
            key,
            label: key.replace(/-/g, " "),
            color: "#94A3B8",
          })),
      ]
    : [];

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setTab("overview");
    }

    onOpenChange(nextOpen);
  }

  async function handleCopyHash() {
    try {
      await navigator.clipboard.writeText(
        resource.file_sha256
      );

      toast.success("SHA-256 hash copied.");
    } catch {
      toast.error("Unable to copy SHA-256 hash.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden bg-white p-0 sm:max-w-[720px]"
      >
        {/* Dialog header */}
        <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 sm:px-6">
          <div className="flex items-center gap-3 text-left">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Shield className="size-6" />
            </div>

            <div>
              <DialogTitle className="text-xl">
                Security Details
              </DialogTitle>

              <DialogDescription className="mt-1">
                File security analysis and validation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Navigation tabs */}
        <div className="shrink-0 border-b px-5 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {[
              {
                value: "overview",
                label: "Overview",
                icon: ShieldCheck,
              },
              {
                value: "technical",
                label: "Technical Details",
                icon: Code2,
              },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
                className={`flex items-center justify-center gap-2 rounded-md px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
                  tab === value
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-white"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">

          {tab === "overview" ? (
            <>
              {/* Security status */}
              <div
                className={`rounded-xl border p-5 text-center ${
                  noThreatsDetected
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {noThreatsDetected ? (
                  <ShieldCheck className="mx-auto mb-3 size-10 text-green-600" />
                ) : (
                  <ShieldAlert className="mx-auto mb-3 size-10" />
                )}

                <h3 className="text-lg font-bold">
                  {noThreatsDetected
                    ? "No threats detected"
                    : isSafe
                      ? "Recorded status: Safe"
                      : "Security status: " +
                        (resource.security_status || "Unknown")}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed">
                  {noThreatsDetected
                    ? "The recorded security scan reported no malicious or suspicious detections."
                    : isSafe && !hasStats
                      ? "This document is marked safe, but detailed scan statistics were not recorded."
                      : "Review the available security information before downloading this document."}
                </p>
              </div>

              {/* Simple scan statistics */}
              {hasStats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">
                      Security engine results
                    </p>
                    <p className="mt-1 text-2xl font-bold">
                      {total}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">
                      Threat detections
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold ${
                        threats === 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {threats}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  Detailed scan statistics are unavailable
                  for this resource.
                </div>
              )}

              {/* Security checks */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold">
                  Security checks
                </h3>

                <SecurityCheck
                  title="File signature validation"
                  passed={signaturePassed}
                  description={
                    signaturePassed
                      ? "The document passed the basic file signature check."
                      : `Validation result: ${signatureStatus}.`
                  }
                />

                <SecurityCheck
                  title="Malware and threat scanning"
                  passed={noThreatsDetected}
                  description={
                    noThreatsDetected
                      ? "VirusTotal reported no malicious or suspicious detections."
                      : "Refer to the recorded security status and available scan details."
                  }
                />

                <SecurityCheck
                  title="File fingerprint"
                  passed={Boolean(reportUrl)}
                  description={
                    reportUrl
                      ? "A SHA-256 fingerprint is recorded for identifying this document."
                      : "A valid SHA-256 fingerprint is unavailable."
                  }
                />
              </section>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
                <span className="text-muted-foreground">
                  Scan recorded at
                </span>

                <span className="font-medium">
                  {formatDate(resource.vt_scanned_at)}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Technical detection statistics */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold">
                  Detection summary
                </h3>

                {hasStats ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Malicious",
                          value: malicious,
                          style:
                            "border-red-200 bg-red-50 text-red-700",
                        },
                        {
                          label: "Suspicious",
                          value: suspicious,
                          style:
                            "border-orange-200 bg-orange-50 text-orange-700",
                        },
                        {
                          label: "Total results",
                          value: total,
                          style:
                            "border-slate-200 bg-slate-50 text-slate-700",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-lg border p-3 text-center ${item.style}`}
                        >
                          <p className="text-2xl font-bold">
                            {item.value}
                          </p>

                          <p className="mt-1 text-xs">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">
                          Detection ratio
                        </span>

                        <span className="font-semibold">
                          {detectionPercentage !== null
                            ? `${threats} / ${total} (${detectionPercentage}%)`
                            : "Not available"}
                        </span>
                      </div>

                      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="bg-red-600"
                          style={{
                            width: `${
                              total > 0
                                ? (malicious / total) * 100
                                : 0
                            }%`,
                          }}
                        />

                        <div
                          className="bg-orange-500"
                          style={{
                            width: `${
                              total > 0
                                ? (suspicious / total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Detailed detection breakdown */}
                    <div className="space-y-3 rounded-lg border p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Engine result breakdown
                      </h4>

                      {categories.map(
                        ({ key, label, color }) => {
                          const count = stats[key] ?? null;

                          return (
                            <div
                              key={key}
                              className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-xs sm:grid-cols-[145px_1fr_32px]"
                            >
                              <span>{label}</span>

                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor: color,
                                    width: `${
                                      count !== null &&
                                      total > 0
                                        ? (count / total) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>

                              <span className="text-right font-semibold">
                                {count ?? "—"}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    Detailed scan statistics were not
                    recorded for this resource.
                  </div>
                )}
              </section>

              {/* File information */}
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <FileText className="size-4" />
                  File information
                </h3>

                <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
                  <InformationItem
                    label="File name"
                    value={resource.file_name}
                  />

                  <InformationItem
                    label="File size"
                    value={formatFileSize(resource.file_size)}
                  />

                  <InformationItem
                    label="Security status"
                    value={resource.security_status}
                  />

                  <InformationItem
                    label="Signature validation"
                    value={signatureStatus}
                  />

                  <InformationItem
                    label="Scan provider"
                    value="VirusTotal"
                  />

                  <InformationItem
                    label="Scan recorded at"
                    value={formatDate(resource.vt_scanned_at)}
                  />

                  <div className="col-span-2">
                    <InformationItem
                      label="MIME type"
                      value={resource.file_type}
                    />
                  </div>
                </div>
              </section>

              {/* SHA-256 hash */}
              <section className="space-y-2">
                <h3 className="text-sm font-bold">
                  File SHA-256
                </h3>

                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <code className="min-w-0 flex-1 break-all text-xs leading-relaxed">
                    {reportUrl
                      ? resource.file_sha256
                      : "Not available"}
                  </code>

                  {reportUrl && (
                    <button
                      type="button"
                      onClick={handleCopyHash}
                      aria-label="Copy SHA-256 hash"
                      title="Copy SHA-256 hash"
                      className="shrink-0 rounded-md border bg-white p-2 transition hover:bg-muted"
                    >
                      <Copy className="size-4" />
                    </button>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Security disclaimer */}
          <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />

            <p className="text-xs leading-relaxed text-muted-foreground">
              {tab === "overview"
                ? "A successful security scan reduces risk but does not guarantee that a document is completely free from threats."
                : "These are historical scan results recorded during upload. Current VirusTotal results may differ. Undetected does not necessarily mean harmless. Signature validation checks basic file signatures, not the complete document structure."}
            </p>
          </div>
        </div>

        {/* Dialog footer */}
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
          >
            Close
          </button>

          {reportUrl ? (
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              See more on VirusTotal
              <ExternalLink className="size-4" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg bg-muted px-4 py-2.5 text-sm text-muted-foreground"
            >
              VirusTotal report unavailable
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
