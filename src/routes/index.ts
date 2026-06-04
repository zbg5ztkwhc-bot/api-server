import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fcmRouter from "./fcm.js";
import configRouter from "./config.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fcmRouter);
router.use(configRouter);

export default router;
