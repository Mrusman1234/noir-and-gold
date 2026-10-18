import { Router, Request, Response } from "express";
import { prisma } from "../config/db.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  try {
    // Perform a lightweight database query to confirm live connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "NOIR & GOLD Express REST API",
      database: {
        status: "connected",
        provider: "SQL (Prisma ORM)",
      },
    });
  } catch (error: any) {
    // Log detailed diagnostics strictly to server logs
    console.error("Health check database connection error:", error);

    // Return sanitized status without exposing internal error or database details
    res.status(503).json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      service: "NOIR & GOLD Express REST API",
      database: {
        status: "disconnected",
        error: "Database service is temporarily unavailable.",
      },
    });
  }
});
