import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/config", (_req, res) => {
  res.json({
    vapidKey: process.env.FIREBASE_VAPID_KEY || "",
  });
});

export default router;
