export type NotificationType =
  | "new_submission"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "new_comment";

export interface KraftNotification {
  id: string;
  type: NotificationType;
  posterId: string;
  message: string;
  read: boolean;
  createdAt: number;
}
