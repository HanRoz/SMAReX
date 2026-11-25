import { supabase } from "../supabaseClient";

export const defaultSettings = {
  email_notifications: true,
  download_notifications: true,
  profile_visibility: true,
  dark_mode: false,
};

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Please sign in first.");
  }

  return user;
}

export async function getUserSettings() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data
    ? {
        ...defaultSettings,
        ...data,
      }
    : { ...defaultSettings };
}

export async function updateUserSettings(changes) {
  const user = await getCurrentUser();

  const { data: existing, error: readError } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) throw readError;

  const settings = {
    ...defaultSettings,
    ...(existing || {}),
    ...changes,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(settings, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export const changeUserPassword = async (currentPassword, newPassword) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    currentPassword: currentPassword,
  });

  if (error) {
    throw error;
  }

  return true;
};