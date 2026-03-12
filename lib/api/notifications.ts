/**
 * Push notification helper via TheNotification.app
 * Sends a push notification to the WeblawBot app on each render completion.
 */

const NOTIFICATION_APP_KEY = "weblawbot_3l88bndrlc37eblqo44zy30iwy1a535o";
const NOTIFICATION_ENDPOINT = "https://thenotification.app/api/sendNotification";

interface NotificationPayload {
  title: string;
  body: string;
  link?: string;
  image?: string;
}

export async function sendPushNotification(payload: NotificationPayload): Promise<void> {
  try {
    const res = await fetch(NOTIFICATION_ENDPOINT, {
      method: "POST",
      headers: {
        app_key: NOTIFICATION_APP_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("[Notification] Failed to send push notification:", res.status, text);
    } else {
      console.log("[Notification] Push notification sent:", payload.title);
    }
  } catch (error) {
    // Never let a notification failure break the render flow
    console.warn("[Notification] Error sending push notification:", error);
  }
}

/**
 * Send a "render completed" notification with the user's name and the render image.
 */
export async function notifyRenderCompleted(opts: {
  userName: string;
  userEmail: string;
  renderId: string;
  imageUrl?: string;
}): Promise<void> {
  await sendPushNotification({
    title: `🎨 New render completed`,
    body: `${opts.userName || opts.userEmail} just generated a render.`,
    link: `https://renderz.ch/profile`,
    image: opts.imageUrl,
  });
}
