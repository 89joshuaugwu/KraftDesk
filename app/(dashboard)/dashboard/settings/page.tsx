"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useUserRole } from "@/lib/roles";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { changePassword } from "@/lib/auth";
import { uploadToCloudinary, validateFileForUpload, getThumbnailUrl } from "@/lib/cloudinary";
import type { NotificationPrefs } from "@/types/user";

export default function SettingsPage() {
  const { user, profile, loading } = useUserRole();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setAvatarUrl(profile.avatarUrl ?? "");
      setPrefs(profile.notificationPrefs);
    }
  }, [profile]);

  if (loading || !user || !prefs) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user!.uid), { displayName, avatarUrl });
      toast.success("Profile updated.");
    } catch {
      toast.error("Couldn't save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    const err = validateFileForUpload(file);
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const result = await uploadToCloudinary(file);
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
      const url = getThumbnailUrl(result.public_id, cloudName);
      setAvatarUrl(url);
      await updateDoc(doc(db, "users", user!.uid), { avatarUrl: url });
      toast.success("Avatar updated.");
    } catch {
      toast.error("Couldn't upload avatar.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePref(key: keyof NotificationPrefs) {
    const next = { ...prefs!, [key]: !prefs![key] };
    setPrefs(next);
    await updateDoc(doc(db, "users", user!.uid), { notificationPrefs: next });
  }

  async function handlePasswordChange() {
    if (!currentPassword || newPassword.length < 6) {
      toast.error("Enter your current password and a new password (6+ chars).");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Couldn't change password. Check your current password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-deep-kraft">Settings</h1>

      <section className="mt-6">
        <h2 className="mb-3 font-semibold text-charcoal">Profile</h2>
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl || "https://api.dicebear.com/9.x/initials/svg?seed=" + displayName}
            alt="Avatar"
            className="h-16 w-16 rounded-full border border-kraft-tan object-cover"
          />
          <label className="cursor-pointer text-sm font-medium text-kraft-brown hover:underline">
            Change avatar
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input label="Email" value={user.email ?? ""} disabled />
          <Button onClick={saveProfile} loading={saving} className="self-start">
            Save profile
          </Button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-charcoal">Notifications</h2>
        {[
          { key: "newSubmission" as const, label: "New submission (reviewer)" },
          { key: "statusChange" as const, label: "Status change (designer)" },
          { key: "newComment" as const, label: "New comment" },
        ].map((item) => (
          <label key={item.key} className="flex items-center justify-between border-b border-kraft-tan py-3 last:border-0">
            <span className="text-sm text-charcoal">{item.label}</span>
            <input
              type="checkbox"
              checked={prefs[item.key]}
              onChange={() => togglePref(item.key)}
              className="h-5 w-5 accent-kraft-brown"
            />
          </label>
        ))}
      </section>

      <section className="mt-8 mb-10">
        <h2 className="mb-3 font-semibold text-charcoal">Change password</h2>
        <div className="flex flex-col gap-3">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button onClick={handlePasswordChange} loading={saving} className="self-start">
            Update password
          </Button>
        </div>
      </section>
    </div>
  );
}
