import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  canViewNotifications,
  getUnreadNotificationCount,
} from "../services/notificationService";
import NotificationsModal from "./NotificationsModal";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user) return;
    const [allowed, count] = await Promise.all([
      canViewNotifications(user),
      getUnreadNotificationCount(user),
    ]);
    setVisible(allowed);
    setUnread(count);
  }, [user]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  if (!user || !visible) return null;

  return (
    <>
      <button
        type="button"
        className="notification-bell"
        aria-label={
          unread > 0
            ? `Notifications, ${unread} unread`
            : "Notifications"
        }
        title="Notifications"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5l-1.8 1.8a1 1 0 0 0 .7 1.7h14.2a1 1 0 0 0 .7-1.7L18 16Z"
          />
        </svg>
        {unread > 0 && (
          <span className="notification-bell-badge">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>
      {open && (
        <NotificationsModal
          onClose={() => setOpen(false)}
          onChanged={refreshUnread}
        />
      )}
    </>
  );
}
