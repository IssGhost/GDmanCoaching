const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();

const allowedOrigins = process.env.CLIENT_URL || process.env.FRONTEND_URL
  ? String(process.env.CLIENT_URL || process.env.FRONTEND_URL)
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true, message: "PicklePro API running" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, message: "PicklePro API running" }));

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/picklepro";

(async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err.message || err);
  }
})();

function safeMount(routePath, modulePath) {
  try {
    const mod = require(modulePath);
    const router = mod?.default || mod;

    const isRouterFn = typeof router === "function";
    const hasHandle = router && typeof router.handle === "function";

    if (!isRouterFn && !hasHandle) {
      throw new Error(
        `Router at ${modulePath} is not valid. typeof=${typeof router} keys=${Object.keys(router || {})}`
      );
    }

    app.use(routePath, router);
    console.log(`Mounted ${routePath} from ${modulePath}`);
  } catch (e) {
    console.error(`Failed to mount ${routePath} from ${modulePath}:`, e.message || e);
  }
}

/*
  Main API mounts.
  These are the clean production paths.
*/
safeMount("/api/auth", "./routes/auth");
safeMount("/api/admin", "./routes/admin");
safeMount("/api/orders", "./routes/orders");
safeMount("/api/quotes", "./routes/quotes");
safeMount("/api/products", "./routes/products");
safeMount("/api/posts", "./routes/posts");
safeMount("/api/tickets", "./routes/tickets");
safeMount("/api/blog", "./routes/blog");
safeMount("/api/testimonials", "./routes/testimonials");
safeMount("/api/coaches", "./routes/coaches");
safeMount("/api/payments", "./routes/payments");
safeMount("/api/videos", "./routes/videos");
safeMount("/api/reviews", "./routes/reviews");
safeMount("/api/demo", "./routes/demo");
safeMount("/api/users", "./routes/auth");

/*
  Compatibility mounts.
  These fix the exact 404s you are seeing:
  POST /demo/seed
  POST /auth/signin
  POST /auth/login
*/
safeMount("/auth", "./routes/auth");
safeMount("/users", "./routes/auth");
safeMount("/demo", "./routes/demo");
safeMount("/admin", "./routes/admin");
safeMount("/orders", "./routes/orders");
safeMount("/quotes", "./routes/quotes");
safeMount("/products", "./routes/products");
safeMount("/posts", "./routes/posts");
safeMount("/tickets", "./routes/tickets");
safeMount("/blog", "./routes/blog");
safeMount("/testimonials", "./routes/testimonials");
safeMount("/coaches", "./routes/coaches");
safeMount("/payments", "./routes/payments");
safeMount("/videos", "./routes/videos");
safeMount("/reviews", "./routes/reviews");

const distDir = path.resolve(__dirname, "..", "dist");
const shouldServeClient =
  process.env.NODE_ENV === "production" ||
  Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);

if (shouldServeClient) {
  app.use(express.static(distDir));

  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({
      error: "Not found",
      path: req.originalUrl,
      hint: "Check that the route is mounted and that your frontend VITE_API_URL matches the backend route prefix.",
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Server error",
    detail: String(err?.message || err),
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Demo seed:    POST http://localhost:${PORT}/demo/seed`);
  console.log(`API seed:     POST http://localhost:${PORT}/api/demo/seed`);
});