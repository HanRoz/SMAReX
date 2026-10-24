import { supabase } from "../supabaseClient";

export async function getResourceLikes(resourceId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in.");
  }

  const { data, error } = await supabase
    .from("resource_likes")
    .select("user_id")
    .eq("resource_id", resourceId);

  if (error) throw error;

  return {
    count: data.length,
    isLiked: data.some((like) => like.user_id === user.id),
  };
}

export async function likeResource(resourceId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in.");
  }

  const { error } = await supabase
    .from("resource_likes")
    .insert({
      resource_id: resourceId,
      user_id: user.id,
    });

  if (error) throw error;
}

export async function unlikeResource(resourceId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please sign in.");
  }

  const { error } = await supabase
    .from("resource_likes")
    .delete()
    .eq("resource_id", resourceId)
    .eq("user_id", user.id);

  if (error) throw error;
}