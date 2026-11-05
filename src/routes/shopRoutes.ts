import { Router } from "express";
import { buyHero } from "../controllers/shopController";

const router = Router();

// Beli hero memakai BP atau DIAMOND
router.post("/:player_id/heroes", buyHero);

export default router;
