import { Router, type IRouter } from "express";
import { getMessaging } from "../lib/firebase-admin.js";

const router: IRouter = Router();

// In-memory token store: { userEmail -> Set<fcmToken> }
// In production you'd persist this to DB; for now in-memory works across restarts
const tokenStore: Map<string, Set<string>> = new Map();

// Register a FCM token for a user
router.post("/fcm/register", (req, res) => {
  const { email, token } = req.body as { email?: string; token?: string };
  if (!email || !token) {
    res.status(400).json({ error: "email and token required" });
    return;
  }
  if (!tokenStore.has(email)) tokenStore.set(email, new Set());
  tokenStore.get(email)!.add(token);
  res.json({ ok: true });
});

// Unregister a FCM token
router.post("/fcm/unregister", (req, res) => {
  const { email, token } = req.body as { email?: string; token?: string };
  if (email && token) tokenStore.get(email)?.delete(token);
  res.json({ ok: true });
});

// Send a push notification to a specific user by email
router.post("/fcm/send", async (req, res) => {
  const { toEmail, title, body, data } = req.body as {
    toEmail?: string;
    title?: string;
    body?: string;
    data?: Record<string, string>;
  };

  if (!toEmail || !title || !body) {
    res.status(400).json({ error: "toEmail, title, and body required" });
    return;
  }

  const tokens = tokenStore.get(toEmail);
  if (!tokens || tokens.size === 0) {
    res.json({ ok: true, sent: 0, reason: "no tokens for user" });
    return;
  }

  const tokenList = [...tokens];
  const messaging = getMessaging();

  try {
    const result = await messaging.sendEachForMulticast({
      tokens: tokenList,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          vibrate: [200, 100, 200, 100, 200],
          renotify: true,
          tag: "mhm-push",
        },
        fcmOptions: { link: "/" },
      },
      data: data ?? {},
    });

    // Remove invalid/expired tokens
    result.responses.forEach((resp, i) => {
      if (!resp.success) {
        const code = resp.error?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          tokens.delete(tokenList[i]);
        }
      }
    });

    res.json({ ok: true, sent: result.successCount, failed: result.failureCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
