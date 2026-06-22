import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import ordersRouter from "./orders";
import wishlistRouter from "./wishlist";
import addressesRouter from "./addresses";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(wishlistRouter);
router.use(addressesRouter);

export default router;
