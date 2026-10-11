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
    isSandboxForwarded?: boolean;
    adminFallbackEmail?: string;
    originalRecipient?: string;
    emailId?: string;
    webhook: boolean;
    simulated: boolean;
  };
  message?: string;
}

// Register Service Worker for mobile push and background notifications
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (e) {
    console.warn('Service Worker registration skipped:', e);
    return null;
  }
};

// 1. Browser Native Desktop & Mobile OS Notification (Lock screen / Toast / Banner)
export const requestDesktopNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    // Register service worker in parallel for mobile support
    registerServiceWorker().catch(() => {});
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
};

export const sendDesktopNotification = async (title: string, body: string, actionUrl?: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const fullTitle = `IntraSphere IMS: ${title}`;
    const options: NotificationOptions = {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      // @ts-expect-error - vibrate is supported in mobile Web Notifications API
      vibrate: [100, 50, 100],
      tag: 'intrasphere-ims-alert-' + Date.now(),
      data: { url: actionUrl || '/' },
    };

    // A. Priority on Mobile (Android & iOS PWA): Use ServiceWorker showNotification
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(fullTitle, options);
          return;
        }
      } catch (err) {
        console.warn('ServiceWorker showNotification fallback:', err);
      }
    }

    // B. Desktop fallback (Windows / macOS corner toasts)
    try {
      const notification = new Notification(fullTitle, options);
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
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const enrichedPayload: NotificationPayload = {
    ...payload,
    actionUrl: payload.actionUrl || (origin ? `${origin}/` : undefined),
  };

  // A. Fire OS Desktop notification if enabled in browser
  sendDesktopNotification(enrichedPayload.title, enrichedPayload.body, enrichedPayload.actionUrl);

  // B. Call server API to send transactional email and/or Slack/Discord webhook
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedPayload),
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
