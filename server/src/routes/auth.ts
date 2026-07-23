import { Router } from "express";
import { ok } from "../middleware/error";
import { requireAuth, getUserId } from "../middleware/auth";
import * as authService from "../services/authService";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const input = authService.zRegister.parse(req.body);
  res.status(201).json(ok(await authService.register(input)));
});

authRouter.post("/login", async (req, res) => {
  const input = authService.zLogin.parse(req.body);
  res.json(ok(await authService.login(input)));
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json(ok(await authService.me(getUserId(req))));
});
