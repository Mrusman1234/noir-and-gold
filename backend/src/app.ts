import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { productRouter } from "./routes/product.routes.js";
import { categoryRouter } from "./routes/category.routes.js";
import { healthRouter } from "./routes/health.routes.js";

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Disable fingerprinting header
app.disable("x-powered-by");

// Standard Security Response Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// Security & Parsing Middlewares
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
app.use(morgan("dev"));

// API Routes
app.use("/api/health", healthRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);

// Root fallback
app.get("/", (_req: Request, res: Response) => {
  res.json({
    service: "NOIR & GOLD Atelier REST API",
    status: "running",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      categories: "/api/categories",
    },
  });
});

// 404 Handler for Unknown Routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Endpoint ${req.method} ${req.originalUrl} does not exist on this server.`,
    },
  });
});

// Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled API Error:", err);
  const status = typeof err.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
  const isProduction = process.env.NODE_ENV === "production";
  const safeMessage =
    status < 500 || !isProduction
      ? err.message || "An unexpected error occurred on the server."
      : "An unexpected error occurred on the server.";

  res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: safeMessage,
    },
  });
});

// Start Server if not imported as module
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`NOIR & GOLD Express REST API running at http://localhost:${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`Products API: http://localhost:${PORT}/api/products`);
    console.log(`Categories API: http://localhost:${PORT}/api/categories`);
  });
}
