import { Router } from "express";
import {
  getGuildOverview,
  getMessagesOverTime,
  getTopUsers,
} from "../../services/analyticsService.js";

const router = Router();

router.get("/:id/overview", async (req, res) => {
  const id = String(req.params.id);
  const result = await getGuildOverview(id);
  if (!result) {
    res.status(404).json({ error: "Guild not found" });
    return;
  }
  res.json(result);
});

router.get("/:id/messages-over-time", async (req, res) => {
  const id = String(req.params.id);
  const days = parseInt(String(req.query.days)) || 30;
  const result = await getMessagesOverTime(id, days);
  if (!result) {
    res.status(404).json({ error: "Guild not found" });
    return;
  }
  res.json(result);
});

router.get("/:id/top-users", async (req, res) => {
  const id = String(req.params.id);
  const limit = parseInt(String(req.query.limit)) || 10;
  const result = await getTopUsers(id, limit);
  if (!result) {
    res.status(404).json({ error: "Guild not found" });
    return;
  }
  res.json(result);
});

export default router;
