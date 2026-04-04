import { type NextFunction, type Request, type Response, Router } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config.js";
import {
  getPresenceConfig,
  setPresenceConfig,
  type PresenceConfig,
} from "../../workers/presenceWorker.js";

const router = Router();

interface JwtPayload {
  discordId: string;
  accessToken: string;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const payload = jwt.verify(token, config.api.jwtSecret) as JwtPayload;
    (req as Request & { discordId: string }).discordId = payload.discordId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const discordId = (req as Request & { discordId?: string }).discordId;
  if (!discordId || !config.api.adminIds.includes(discordId)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/", requireAuth, (_req, res) => {
  res.json(getPresenceConfig());
});

router.put("/", requireAuth, requireAdmin, (req, res) => {
  const body = req.body as Partial<PresenceConfig>;
  const { status, slots, intervalSeconds } = body;

  if (
    !["online", "idle", "dnd", "invisible"].includes(status ?? "") ||
    !Array.isArray(slots) ||
    typeof intervalSeconds !== "number" ||
    intervalSeconds < 10
  ) {
    res.status(400).json({ error: "Invalid presence config" });
    return;
  }

  const validTypes = new Set(["Playing", "Watching", "Listening", "Competing"]);
  for (const slot of slots) {
    if (
      typeof slot.id !== "string" ||
      !validTypes.has(slot.type) ||
      typeof slot.template !== "string" ||
      slot.template.trim().length === 0 ||
      slot.template.length > 128
    ) {
      res.status(400).json({ error: "Invalid slot" });
      return;
    }
  }

  setPresenceConfig({ status: status!, slots, intervalSeconds });
  res.json({ ok: true });
});

export default router;
