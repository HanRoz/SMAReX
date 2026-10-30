import {
  ExternalLink,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../assets/ui/button";
import { Checkbox } from "../assets/ui/checkbox";
import { Input } from "../assets/ui/input";
import { Label } from "../assets/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../assets/ui/select";
import { Textarea } from "../assets/ui/textarea";
import { Sidebar } from "../components/sidebar";

import {
  uploadResource,
  validateDocument,
  validateThumbnail,
} from "../services/resourceService";

const KULLIYYAHS = [
  "AIKOL", "KENMS", "KOED", "KICT", "KIRKHS",
  "KOM", "KOD", "ISTAC", "KOP", "KON",
  "KAHS", "KOS", "KSTCL", "KOE",
  "IIiBF", "INHART", "PLANETIIUM",
];

const INITIAL_FORM = {
  title: "",
  description: "",
  kulliyyah: "",
  subjectCode: "",
  tags: "",
};

export default function Upload() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanProgress, setScanProgress] = useState("");
  const [uploadError, setUploadError] = useState("");

  const resetScan = () => {
    setScanResult(null);
    setUploadError("");
    setScanProgress("");
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Create and clean up thumbnail preview URLs
  useEffect(() => {
    if (!selectedThumbnail) {
      setThumbnailPreview(null);
      return;
    }

    const url = URL.createObjectURL(selectedThumbnail);
    setThumbnailPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedThumbnail]);

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleFileSelect = (file) => {
    try {
      validateDocument(file);

      setScanResult(null);
      setUploadError("");
      setScanProgress("");
      setSelectedFile(file);

      toast.success(`Selected: ${file.name}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleThumbnailSelect = (file) => {
    try {
      validateThumbnail(file);
      setSelectedThumbnail(file);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a document.");
      return;
    }

    if (!formData.kulliyyah) {
      toast.error("Please select a Kulliyyah.");
      return;
    }

    if (!acknowledged) {
      toast.error("Please accept the content policy.");
      return;
    }

    if (isUploading) return;

    setIsUploading(true);
    setScanResult(null);
    setUploadError("");
    setScanProgress("Uploading file for security scanning...");

    try {
      const resource = await uploadResource({
        file: selectedFile,
        thumbnail: selectedThumbnail,
        ...formData,

        // Receives progress updates from VirusTotal scanning.
        onScanProgress: (message) => {
          setScanProgress(message);
        },
      });

      setScanResult(resource.virusTotal);
      setScanProgress("");

      toast.success("Resource uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);

      if (error.details) {
        setScanResult(error.details);
        setUploadError("");
      } else {
        setUploadError(error.message || "Upload failed.");
        toast.error(error.message || "Upload failed.");
      }
    } finally {
      setIsUploading(false);
      setScanProgress("");
    }
  };

  const isBlocked =
    scanResult && scanResult.allowed !== true;

  const isMalicious =
    scanResult?.reason === "malicious" ||
    Number(scanResult?.malicious) > 0;

  const isSuspicious =
    scanResult?.reason === "suspicious" ||
    Number(scanResult?.suspicious) > 0;

  const detectionCount =
    Number(scanResult?.malicious || 0) +
    Number(scanResult?.suspicious || 0);

  const engineCount = Number(scanResult?.total || 0);

  const detectionRate = engineCount
    ? Math.round((detectionCount / engineCount) * 100)
    : 0;

  return (
    <Sidebar>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            Upload Resource
          </h1>

          <p className="text-muted-foreground">
            Share your academic materials with fellow IIUM students
          </p>
        </div>

        {scanResult ? (
          <section
            aria-live="polite"
            className={`bg-card border rounded-lg p-6 shadow-sm ${
              isMalicious
                ? "border-red-300"
                : isSuspicious
                  ? "border-amber-300"
                  : isBlocked
                    ? "border-border"
                    : "border-emerald-300"
            }`}
          >
            <div className="text-center">
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                  isMalicious
                    ? "bg-red-100 text-red-700"
                    : isSuspicious
                      ? "bg-amber-100 text-amber-700"
                      : isBlocked
                        ? "bg-slate-100 text-slate-700"
                        : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isMalicious ? (
                  <ShieldX className="h-6 w-6" />
                ) : isSuspicious ? (
                  <ShieldAlert className="h-6 w-6" />
                ) : isBlocked ? (
                  <ShieldAlert className="h-6 w-6" />
                ) : (
                  <ShieldCheck className="h-6 w-6" />
                )}
              </div>

              <h2 className="text-xl font-semibold">
                {isMalicious
                  ? "Malicious File Detected"
                  : isSuspicious
                    ? "Suspicious File Detected"
                    : isBlocked
                      ? "File Could Not Be Verified"
                      : "Security Scan Complete"}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {scanResult.summary ||
                  (isBlocked
                    ? "This file was not uploaded because its safety could not be confirmed."
                    : "No suspicious or malicious detections were found.")}
              </p>

              <p
                className={`mt-3 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                  isMalicious
                    ? "bg-red-100 text-red-800"
                    : isSuspicious
                      ? "bg-amber-100 text-amber-800"
                      : isBlocked
                        ? "bg-slate-100 text-slate-800"
                        : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isBlocked ? "Not uploaded" : "Safe to share"}
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-border p-4">
              <h3 className="font-semibold">
                VirusTotal Scan Results
              </h3>

              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">
                    File scanned
                  </dt>
                  <dd className="mt-1 break-all font-medium">
                    {selectedFile?.name || "Selected file"}
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground">
                    File size
                  </dt>
                  <dd className="mt-1 font-medium">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : "Unavailable"}
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground">
                    Security engines
                  </dt>
                  <dd className="mt-1 font-medium">
                    {engineCount > 0
                      ? `${engineCount} scanned`
                      : "Scan unavailable"}
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground">
                    Detections
                  </dt>
                  <dd
                    className={`mt-1 font-semibold ${
                      detectionCount
                        ? "text-red-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {detectionCount > 0
                      ? `${detectionCount} flagged (${Number(scanResult.malicious || 0)} malicious, ${Number(scanResult.suspicious || 0)} suspicious)`
                      : isBlocked
                        ? "Could not complete scan"
                        : "No threats detected"}
                  </dd>
                </div>
              </dl>

              {engineCount > 0 && detectionCount > 0 && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs">
                    <span>Engines that flagged this file</span>
                    <span>{detectionRate}%</span>
                  </div>

                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label="VirusTotal detection rate"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={detectionRate}
                  >
                    <div
                      className={`h-full ${
                        isMalicious
                          ? "bg-red-600"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${detectionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {isBlocked && (
              <div
                className={`mt-4 rounded-lg p-4 text-sm ${
                  isMalicious
                    ? "border border-red-200 bg-red-50 text-red-900"
                    : "border border-amber-200 bg-amber-50 text-amber-950"
                }`}
              >
                <p className="font-semibold">
                  {isMalicious
                    ? "What should I do?"
                    : "Why was this blocked?"}
                </p>

                <p className="mt-1">
                  {isMalicious
                    ? "Do not share this file. Remove it from your device and use a trusted source for a safe copy."
                    : isSuspicious
                      ? "One or more security engines flagged this file. It was not shared. Check the detailed report or choose a different file."
                      : "The scan could not be completed. For your protection, this file was not uploaded. Please try again later or choose another file."}
                </p>
              </div>
            )}

            {!isBlocked && (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                Your resource was uploaded successfully.
              </p>
            )}

            {uploadError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
              >
                {uploadError}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {scanResult.reportUrl && (
                <Button asChild className="flex-1">
                  <a
                    href={scanResult.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View detailed VirusTotal report
                  </a>
                </Button>
              )}

              {isBlocked ? (
                <Button
                  type="button"
                  variant={scanResult.reportUrl ? "outline" : "default"}
                  className="flex-1"
                  onClick={resetScan}
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload another document
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/profile")}
                >
                  View my resources
                </Button>
              )}
            </div>
          </section>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Resource Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Resource Title
                </Label>

                <Input
                  id="title"
                  placeholder="e.g., Data Structures Complete Notes"
                  value={formData.title}
                  onChange={(e) =>
                    updateField("title", e.target.value)
                  }
                  disabled={isUploading}
                  maxLength={200}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description
                </Label>

                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe what this resource covers..."
                  value={formData.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  disabled={isUploading}
                  required
                />
              </div>

              {/* Kulliyyah and Subject Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kulliyyah</Label>

                  <Select
                    value={formData.kulliyyah}
                    onValueChange={(value) =>
                      updateField("kulliyyah", value)
                    }
                    disabled={isUploading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select kulliyyah" />
                    </SelectTrigger>

                    <SelectContent>
                      {KULLIYYAHS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjectCode">
                    Subject Code
                  </Label>

                  <Input
                    id="subjectCode"
                    placeholder="e.g., CSCI 2302"
                    value={formData.subjectCode}
                    onChange={(e) =>
                      updateField("subjectCode", e.target.value)
                    }
                    disabled={isUploading}
                    required
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">
                  Tags
                </Label>

                <Input
                  id="tags"
                  placeholder="e.g., algorithms, notes, revision"
                  value={formData.tags}
                  onChange={(e) =>
                    updateField("tags", e.target.value)
                  }
                  disabled={isUploading}
                />

                <p className="text-xs text-muted-foreground">
                  Separate tags using commas.
                </p>
              </div>

              {/* Document Selection */}
              <div className="space-y-2">
                <Label>Upload File</Label>

                <div
                  role="button"
                  tabIndex={isUploading ? -1 : 0}
                  aria-label="Choose document"
                  onClick={() => {
                    if (!isUploading) {
                      fileInputRef.current?.click();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === " ") &&
                      !isUploading
                    ) {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isUploading) {
                      setIsDragging(true);
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isUploading
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  } ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {selectedFile ? (
                    <>
                      <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />

                      <p className="font-medium break-all">
                        {selectedFile.name}
                      </p>

                      <p className="text-sm text-muted-foreground mt-1">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>

                      <p className="text-xs text-primary mt-2">
                        Click or drag to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />

                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>

                      <p className="text-xs text-muted-foreground">
                        PDF, DOCX, PPTX (max 50 MB)
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.pptx"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      handleFileSelect(file);
                    }

                    e.target.value = "";
                  }}
                />
              </div>

              {/* Optional Thumbnail */}
              <div className="space-y-2">
                <Label>Preview Image (Optional)</Label>

                <p className="text-xs text-muted-foreground">
                  Add an image to represent your resource.
                </p>

                {thumbnailPreview ? (
                  <div className="relative border border-border rounded-lg overflow-hidden">
                    <img
                      src={thumbnailPreview}
                      alt="Selected thumbnail preview"
                      className="w-full h-48 object-cover"
                    />

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      disabled={isUploading}
                      onClick={() => setSelectedThumbnail(null)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() =>
                      thumbnailInputRef.current?.click()
                    }
                    className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors disabled:opacity-50"
                  >
                    <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />

                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload preview image
                    </p>

                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WebP (max 5 MB)
                    </p>
                  </button>
                )}

                <input
                  ref={thumbnailInputRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      handleThumbnailSelect(file);
                    }

                    e.target.value = "";
                  }}
                />
              </div>

              {/* Content Policy */}
              <div className="space-y-3">
                <div className="bg-blue-50 border-2 border-primary rounded-lg p-4">
                  <p className="text-sm font-semibold text-primary mb-2">
                    Content Policy
                  </p>

                  <p className="text-sm text-gray-900 leading-relaxed">
                    <strong className="text-primary">
                      ALLOWED:
                    </strong>{" "}
                    Original student-created or lecturer-permitted
                    notes, summaries, tutorials, and revision materials.
                  </p>

                  <p className="text-sm text-gray-900 leading-relaxed mt-1">
                    <strong className="text-red-600">
                      PROHIBITED:
                    </strong>{" "}
                    Copyrighted books, commercial content, and
                    unauthorized lecturer materials.
                  </p>
                </div>

                <div className="bg-blue-50/50 border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acknowledge"
                      checked={acknowledged}
                      onCheckedChange={(checked) =>
                        setAcknowledged(checked === true)
                      }
                      disabled={isUploading}
                    />

                    <label
                      htmlFor="acknowledge"
                      className="text-sm cursor-pointer leading-relaxed"
                    >
                      <strong>
                        I confirm that this material is my own work or
                        I have permission to share it.
                      </strong>{" "}
                      I acknowledge that I am responsible for the
                      content I upload.
                    </label>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-5 w-5 shrink-0" />

                  <p>
                    Files are checked with VirusTotal before they are
                    uploaded. A file is blocked if it is flagged or
                    the scan failed.
                  </p>
                </div>

                <p>
                  VirusTotal may share submitted files with its
                  security community. Do not upload private or
                  sensitive documents.
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isUploading || !acknowledged}
              >
                {isUploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Submit Resource
                  </>
                )}
              </Button>

              {/* Single loading indicator */}
              {isUploading && (
                <div
                  className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" />

                  <div>
                    <p className="font-semibold">
                      {scanProgress || "Security scan in progress"}
                    </p>

                    <p className="mt-1">
                      Please wait while we check and upload your document.
                      Do not close or refresh this page.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
