
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
