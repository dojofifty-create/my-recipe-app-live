import type { NextFunction, Request, Response } from "express";

export function isAdminRequest(req: Request): boolean {
  if (typeof req.isAuthenticated !== "function" || !req.isAuthenticated()) {
    return false;
  }

  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = req.user?.email?.trim().toLowerCase();
  return Boolean(configuredEmail && userEmail && userEmail === configuredEmail);
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.isAuthenticated !== "function" || !req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }

  if (!isAdminRequest(req)) {
    res.status(403).json({ error: "Access denied." });
    return;
  }

  next();
}
