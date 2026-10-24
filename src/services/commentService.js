
import { supabase } from "../supabaseClient";

export function validateComment(content) {
  const text = content.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const characters = Array.from(text).length;

  if (!text) throw new Error("Comment cannot be empty.");
  if (words > 100) throw new Error("Maximum 100 words allowed.");
  if (characters > 700) throw new Error("Maximum 700 characters allowed.");

  return text;
}

async function currentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Please sign in.");
  return user;
}

export async function getComments(resourceId, page = 0) {
  const from = page * 20;
  const { data, error } = await supabase
    .from("resource_comments")
.select(`
  id,
  resource_id,
  user_id,
  content,
  created_at,
  updated_at,
  profiles:profiles!resource_comments_profile_fkey (
    display_name
  )
`)    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + 20);

if (error) throw error;

const visibleComments = data.slice(0, 20);

const userIds = [...new Set(
  visibleComments.map((comment) => comment.user_id)
)];

let authorMap = {};

if (userIds.length > 0) {
  const { data: authors, error: authorsError } = await supabase
    .from("comment_authors")
    .select("id, display_name")
    .in("id", userIds);

  if (authorsError) throw authorsError;

  authorMap = Object.fromEntries(
    authors.map((author) => [author.id, author.display_name])
  );
}

return {
  comments: visibleComments.map((comment) => ({
    ...comment,
    authorName: authorMap[comment.user_id] || "Student",
  })),
  hasMore: data.length > 20,
};
}

export async function postComment(resourceId, content) {
  const user = await currentUser();
  const { error } = await supabase
    .from("resource_comments")
    .insert({
      resource_id: resourceId,
      user_id: user.id,
      content: validateComment(content),
    });

  if (error) throw error;
}

export async function editComment(commentId, content) {
  const user = await currentUser();
  const { data, error } = await supabase
    .from("resource_comments")
    .update({
      content: validateComment(content),
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select("id");

  if (error) throw error;
  if (!data.length) throw new Error("Comment could not be updated.");
}

export async function deleteComment(commentId) {
  const user = await currentUser();
  const { data, error } = await supabase
    .from("resource_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select("id");

  if (error) throw error;
  if (!data.length) throw new Error("Comment could not be deleted.");
}
