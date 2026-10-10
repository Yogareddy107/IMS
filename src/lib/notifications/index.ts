// IntraSphere Labs — Out-of-App Notification Engine
// Supports:
// 1. Browser OS Desktop Push Notifications (pops up on Windows/macOS even when browser is minimized)
// 2. Transactional Email Dispatch (Resend / SMTP / Supabase Edge Functions)
// 3. Team Webhooks (Slack / Discord incoming webhooks)

export interface NotificationPayload {
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  title: string;
  body: string;
  actionUrl?: string;
  type:
    | 'task_assigned'
    | 'task_completed'
    | 'announcement'
    | 'checkin_submitted'
    | 'checkin_reviewed'
    | 'blocker_alert'
    | 'offer_letter'
    | 'performance_review'
    | 'general';
}

export interface NotificationResult {
  success: boolean;
  delivered?: {
    email: boolean;
    deliveredTo?: string;
    emailId?: string;
    webhook: boolean;
    simulated: boolean;
  };
  message?: string;
}

// 1. Browser Native Desktop Notification (OS level toast)
export const requestDesktopNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
};

export const sendDesktopNotification = (title: string, body: string, actionUrl?: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(`IntraSphere IMS: ${title}`, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'intrasphere-ims-alert-' + Date.now(),
      });

      if (actionUrl) {
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    } catch (e) {
      console.warn('Native notification trigger failed:', e);
    }
  }
};

// 2. Dispatch Out-of-App Notification (Email, Webhook, Desktop)
export const dispatchNotification = async (
  payload: NotificationPayload
): Promise<NotificationResult> => {
  // A. Fire OS Desktop notification if enabled in browser
  sendDesktopNotification(payload.title, payload.body, payload.actionUrl);

  // B. Call server API to send transactional email and/or Slack/Discord webhook
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return data as NotificationResult;
      }
    }
  } catch (err) {
    console.warn('Notification API dispatch warning:', err);
  }

  return { success: false, message: 'Dispatched locally' };
};
