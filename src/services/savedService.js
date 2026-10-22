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

export async function isResourceSaved(resourceId) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("saved_resources")
    .select("resource_id")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

export async function saveResource(resourceId) {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("saved_resources")
    .upsert(
      {
        user_id: userId,
        resource_id: resourceId,
      },
      {
        onConflict: "user_id,resource_id",
        ignoreDuplicates: true,
      }
    );

  if (error) throw error;
}

export async function unsaveResource(resourceId) {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("saved_resources")
    .delete()
    .eq("user_id", userId)
    .eq("resource_id", resourceId);

  if (error) throw error;
}

export async function getSavedResources() {
  const userId = await getCurrentUserId();

  // First retrieve the user's bookmarks.
  const { data: bookmarks, error: bookmarkError } = await supabase
    .from("saved_resources")
    .select("resource_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (bookmarkError) throw bookmarkError;

  if (!bookmarks?.length) return [];

  const ids = bookmarks.map((item) => item.resource_id);

  // Resource RLS still controls which documents are visible.
  const { data: resources, error: resourceError } = await supabase
    .from("resources")
    .select("*")
    .in("id", ids);

  if (resourceError) throw resourceError;

  const resourceMap = new Map(
    (resources || []).map((resource) => [resource.id, resource])
  );

  // Preserve the bookmark order and exclude inaccessible resources.
  return bookmarks
    .map((bookmark) => {
      const resource = resourceMap.get(bookmark.resource_id);

      return resource
        ? { ...resource, saved_at: bookmark.created_at }
        : null;
    })
    .filter(Boolean);
}