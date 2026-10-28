import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storageRouter from "./storage";
import recipeRouter from "./recipes";
import foodRouter from "./foods";
import adminRouter from "./admin";
import contactRouter from "./contact";
import { requireAdmin } from "../middlewares/admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/storage/uploads/request-url", requireAdmin);
router.use(storageRouter);
router.use(recipeRouter);
router.use(foodRouter);
router.use(adminRouter);
router.use(contactRouter);

export default router;
