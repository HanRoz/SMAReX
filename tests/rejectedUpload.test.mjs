import assert from "node:assert/strict";
import { test } from "node:test";

// Simulated database records.
const records = [];

// Mock Supabase client.
const adminDb = {
  from(table) {
    assert.equal(table, "rejected_uploads");

    return {
      async insert(record) {
        records.push(record);
        return { error: null };
      },
    };
  },
};

// Simulated authenticated upload metadata.
const context = {
  adminDb,
  uploaderId: "11111111-1111-4111-8111-111111111111",
  fileName: "test-document.pdf",
  fileSize: 1024,
  fileType: "pdf",
};

const sha256 = "a".repeat(64);
const reportUrl = `https://www.virustotal.com/gui/file/${sha256}`;

// Rejected upload logging logic.
async function logRejectedUpload(
  context,
  sha256,
  maliciousCount,
  suspiciousCount,
  total,
  reportUrl,
) {
  try {
    const securityStatus =
      maliciousCount > 0 ? "malicious" : "suspicious";

    const rejectionReason =
      `VirusTotal detected ${maliciousCount} malicious and ` +
      `${suspiciousCount} suspicious result(s).`;

    const { error } = await context.adminDb
      .from("rejected_uploads")
      .insert({
        uploader_id: context.uploaderId,
        file_name: context.fileName,
        file_size: context.fileSize,
        file_type: context.fileType,
        file_sha256: sha256,
        security_status: securityStatus,
        malicious_count: maliciousCount,
        suspicious_count: suspiciousCount,
        total_engines: total,
        vt_report_url: reportUrl,
        rejection_reason: rejectionReason,
      });

    if (error) {
      console.error("Rejected upload logging failed:", error);
    }
  } catch (error) {
    console.error("Logging exception:", error.message);
  }
}

// Simulate completed VirusTotal scan.
async function simulateScan(
  malicious,
  suspicious,
  total = 70,
  scanContext = context,
) {
  const allowed = malicious === 0 && suspicious === 0;

  if (!allowed) {
    await logRejectedUpload(
      scanContext,
      sha256,
      malicious,
      suspicious,
      total,
      reportUrl,
    );
  }

  return {
    allowed,
    pending: false,
    reason: allowed ? "clean" : "threat_detected",
    malicious,
    suspicious,
    total,
    reportUrl,
  };
}

// TEST 1: Clean file.
test("Clean file is allowed without logging", async () => {
  records.length = 0;

  const result = await simulateScan(0, 0);

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "clean");
  assert.equal(records.length, 0);
});

// TEST 2: Malicious file.
test("Malicious file is rejected and logged", async () => {
  records.length = 0;

  const result = await simulateScan(5, 0);

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "threat_detected");
  assert.equal(records.length, 1);
  assert.equal(records[0].security_status, "malicious");
  assert.equal(records[0].malicious_count, 5);
  assert.equal(records[0].suspicious_count, 0);
});

// TEST 3: Suspicious file.
test("Suspicious file is rejected and logged", async () => {
  records.length = 0;

  const result = await simulateScan(0, 3);

  assert.equal(result.allowed, false);
  assert.equal(records.length, 1);
  assert.equal(records[0].security_status, "suspicious");
  assert.equal(records[0].malicious_count, 0);
  assert.equal(records[0].suspicious_count, 3);
});

// TEST 4: Both malicious and suspicious.
test("Malicious status takes priority", async () => {
  records.length = 0;

  const result = await simulateScan(5, 3);

  assert.equal(result.allowed, false);
  assert.equal(records.length, 1);
  assert.equal(records[0].security_status, "malicious");
  assert.equal(records[0].malicious_count, 5);
  assert.equal(records[0].suspicious_count, 3);
});

// TEST 5: Verify recorded metadata.
test("Rejected upload metadata is recorded correctly", async () => {
  records.length = 0;

  await simulateScan(5, 0);

  const record = records[0];

  assert.equal(record.uploader_id, context.uploaderId);
  assert.equal(record.file_name, context.fileName);
  assert.equal(record.file_size, context.fileSize);
  assert.equal(record.file_type, context.fileType);
  assert.equal(record.file_sha256, sha256);
  assert.equal(record.total_engines, 70);
  assert.equal(record.vt_report_url, reportUrl);

  assert.equal(
    record.rejection_reason,
    "VirusTotal detected 5 malicious and 0 suspicious result(s).",
  );
});

// TEST 6: Database insertion failure.
test("File remains rejected when database logging fails", async () => {
  records.length = 0;

  const failingContext = {
    ...context,
    adminDb: {
      from() {
        return {
          async insert() {
            return {
              error: {
                message: "Simulated database failure",
              },
            };
          },
        };
      },
    },
  };

  const result = await simulateScan(5, 0, 70, failingContext);

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "threat_detected");
  assert.equal(records.length, 0);
});