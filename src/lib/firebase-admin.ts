import admin from "firebase-admin";

let app: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (app) return app;

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountRaw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountRaw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
  }

  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
  } else {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return app;
}

export function getMessaging(): admin.messaging.Messaging {
  return getFirebaseAdmin().messaging();
}
