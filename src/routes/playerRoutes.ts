import { Router } from "express";
import {
  addMatchResult,
  createPlayer,
  deletePlayer,
  getAllPlayers,
  getPlayerById,
  topUpDiamond,
  updatePlayer,
} from "../controllers/playerController";

const router = Router();

// Rute ini melayani dropdown player di web frontend
router.get("/", getAllPlayers);

// CRUD Player
router.post("/", createPlayer);
router.get("/:player_id", getPlayerById);
router.patch("/:player_id", updatePlayer);
router.delete("/:player_id", deletePlayer);

// Fitur Ekonomi Player (Top Up & Match Rewards)
router.post("/:player_id/topup", topUpDiamond);
router.post("/:player_id/matches", addMatchResult);

export default router;