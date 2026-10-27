import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Sidebar } from "../components/sidebar";
import {
  defaultSettings,
  getUserSettings,
  updateUserSettings,
  changeUserPassword,
} from "../services/settingsService";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [savingPreference, setSavingPreference] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const data = await getUserSettings();

        if (active) {
          setSettings(data);
        }
      } catch (err) {
        if (active) {
          toast.error(err.message || "Failed to load settings");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const handlePreferenceChange = async (key, value) => {
    if (savingPreference) return;

    const previous = settings;

    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSavingPreference(true);

    try {
      await updateUserSettings({ [key]: value });

      if (key === "dark_mode") {
        document.documentElement.classList.toggle("dark", value);
      }

      toast.success("Preference updated");
    } catch (err) {
      setSettings(previous);
      toast.error(err.message || "Failed to update preference");
    } finally {
      setSavingPreference(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please complete all password fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different");
      return;
    }

    try {
      setChangingPassword(true);

      await changeUserPassword(currentPassword, newPassword);

      toast.success("Password updated successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const inputClass =
    "w-full h-10 rounded-md border border-input bg-background px-3 text-sm";

  const switchClass = (enabled) =>
    `relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-primary" : "bg-muted"
    }`;

  const PreferenceSwitch = ({ settingKey }) => (
    <button
      type="button"
      role="switch"
      aria-checked={settings[settingKey]}
      disabled={loading || savingPreference}
      onClick={() =>
        handlePreferenceChange(settingKey, !settings[settingKey])
      }
      className={switchClass(settings[settingKey])}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings[settingKey]
          ? "translate-x-5"
          : "translate-x-0.5"
          }`}
      />
    </button>
  );

  const PreferenceRow = ({
    title,
    description,
    settingKey,
  }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <PreferenceSwitch settingKey={settingKey} />
    </div>
  );

  return (
    <Sidebar>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-semibold mb-2">
            Settings
          </h1>

          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Change Password */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">
            Change Password
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium">
                Current Password
              </label>

              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </label>

              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {changingPassword
                ? "Updating..."
                : "Update Password"}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">
            Notification Settings
          </h2>

          <div className="space-y-5">
            <PreferenceRow
              title="Email Notifications"
              description="Receive email updates about new resources"
              settingKey="email_notifications"
            />

            <PreferenceRow
              title="Download Notifications"
              description="Get notified when someone downloads your resources"
              settingKey="download_notifications"
            />
          </div>

          <p className="text-xs text-muted-foreground mt-5">
            Notification delivery is not yet available.
            These settings save your preferences for future use.
          </p>
        </div>

        {/* Privacy */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">
            Privacy Settings
          </h2>

          <PreferenceRow
            title="Profile Visibility"
            description="Allow others to view your profile and uploads"
            settingKey="profile_visibility"
          />

          <p className="text-xs text-muted-foreground mt-5">
            Profile visibility enforcement will be available
            when public profiles are implemented.
          </p>
        </div>

        {/* Appearance */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">
            Appearance
          </h2>

          <PreferenceRow
            title="Dark Mode"
            description="Switch to dark theme"
            settingKey="dark_mode"
          />
        </div>

      </div>
    </Sidebar>
  );
}
