import { supabase } from "../supabaseClient";

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Please sign in first.");
  }

  return user.id;
}

export async function recordDownload(resourceId) {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("download_history")
    .upsert(
      {
        user_id: userId,
        resource_id: resourceId,
        downloaded_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,resource_id",
      }
    );

  if (error) throw error;
}

export async function getLibraryResources() {
  const userId = await getCurrentUserId();

  const { data: history, error: historyError } = await supabase
    .from("download_history")
    .select("resource_id, downloaded_at")
    .eq("user_id", userId)
    .order("downloaded_at", { ascending: false });

  if (historyError) throw historyError;

  if (!history?.length) return [];

  const ids = history.map((item) => item.resource_id);

  const { data: resources, error: resourceError } = await supabase
    .from("resources")
    .select("*")
    .in("id", ids);

  if (resourceError) throw resourceError;

  const resourceMap = new Map(
    (resources || []).map((resource) => [resource.id, resource])
  );

  return history
    .map((item) => {
      const resource = resourceMap.get(item.resource_id);

      return resource
        ? {
            ...resource,
            downloaded_at: item.downloaded_at,
          }
        : null;
    })
    .filter(Boolean);
}