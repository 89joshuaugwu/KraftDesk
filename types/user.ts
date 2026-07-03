export type UserRole = "designer" | "reviewer" | "admin";

export interface NotificationPrefs {
  newSubmission: boolean;
  statusChange: boolean;
  newComment: boolean;
}

export interface KraftUser {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  notificationPrefs: NotificationPrefs;
  createdAt: number;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  newSubmission: true,
  statusChange: true,
  newComment: true,
};
