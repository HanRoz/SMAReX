
import { supabase } from "../supabaseClient";

export const REPORT_REASONS = [
  "Copyright Violation",
  "Inappropriate Content",
  "Misleading Information",
  "Security Concern",
  "Other",
];

export async function hasReportedResource(resourceId) {
  const { data, error } = await supabase
    .from("resource_reports")
    .select("id")
    .eq("resource_id", resourceId)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

export async function submitResourceReport(resourceId, reason, description = "") {
  if (!REPORT_REASONS.includes(reason)) {
    throw new Error("Please select a valid report reason.");
  }

  const details = description.trim();

  if (details.length > 500) {
    throw new Error("Description must not exceed 500 characters.");
  }

  const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  throw new Error("Please sign in to report a resource.");
}

  const { error } = await supabase
    .from("resource_reports")
    .insert({
      resource_id: resourceId,
      user_id: user.id,
      reason,
      description: details || null,
    });

  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already reported this resource.");
    }
    throw error;
  }
}

export async function getMyReports() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in to view your reports.");
  }

  const { data: reports, error } = await supabase
    .from("resource_reports")
    .select("id, resource_id, reason, description, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!reports?.length) return [];

  const resourceIds = [...new Set(reports.map((report) => report.resource_id))];

  const { data: resources, error: resourceError } = await supabase
    .from("resources")
    .select("id, title, subject_code, kulliyyah")
    .in("id", resourceIds);

  if (resourceError) throw resourceError;

  const resourceMap = new Map(
    (resources || []).map((resource) => [resource.id, resource])
  );

  return reports.map((report) => ({
    ...report,
    resource: resourceMap.get(report.resource_id) || null,
  }));
}

export async function getResourceReportCount(resourceId) {
  const { data, error } = await supabase.rpc(
    "get_resource_report_count",
    { p_resource_id: resourceId }
  );

  if (error) throw error;

  return data ?? 0;
}
