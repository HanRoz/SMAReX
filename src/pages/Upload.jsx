import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  FileText,
  ShieldAlert,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Sidebar } from "../components/sidebar";
import { Button } from "../assets/ui/button";
import { Input } from "../assets/ui/input";
import { Label } from "../assets/ui/label";
import { Textarea } from "../assets/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../assets/ui/select";
import { Checkbox } from "../assets/ui/checkbox";

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

    try {
      await uploadResource({
        file: selectedFile,
        thumbnail: selectedThumbnail,
        ...formData,
      });

      toast.success(
        "Resource submitted! Security review is pending."
      );

      navigate("/profile");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

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

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Resource Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Resource Title</Label>
              <Input
                id="title"
                placeholder="e.g., Data Structures Complete Notes"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                disabled={isUploading}
                maxLength={200}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe what this resource covers..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
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
                <Label htmlFor="subjectCode">Subject Code</Label>
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
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="e.g., algorithms, notes, revision"
                value={formData.tags}
                onChange={(e) => updateField("tags", e.target.value)}
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
                  if (!isUploading) fileInputRef.current?.click();
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
                  if (!isUploading) setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isUploading
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                  } ${isDragging
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
                  if (file) handleFileSelect(file);
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
                  if (file) handleThumbnailSelect(file);
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
                  <strong className="text-primary">ALLOWED:</strong>{" "}
                  Original student-created or lecturer-permitted
                  notes, summaries, tutorials, and revision materials.
                </p>
                <p className="text-sm text-gray-900 leading-relaxed mt-1">
                  <strong className="text-red-600">PROHIBITED:</strong>{" "}
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
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p>
                Security scanning is not yet connected.
                Submitted resources remain pending and are not
                publicly available to other users.
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={isUploading || !acknowledged}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Submit Resource
                </>
              )}
            </Button>

          </form>
        </div>
      </div>
    </Sidebar>
  );
}
