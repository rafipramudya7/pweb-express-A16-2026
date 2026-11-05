import { Router } from "express";
import { getStatistics } from "../controllers/statisticController";

const router = Router();

// Statistik keseluruhan toko MLBB
router.get("/", getStatistics);

export default router;
