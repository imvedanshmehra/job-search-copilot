import express from "express";
import { Pool } from "pg";

const port = Number(process.env.PORT ?? 3001);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 3000,
});

// Without this handler, a dropped idle-client connection (e.g. Postgres
// restarting) throws an uncaught error and crashes the process.
pool.on("error", (err) => {
  console.error("[api] unexpected error on idle Postgres client", err);
});

// Node's dual-stack connect attempts (e.g. a refused localhost connection)
// surface as an AggregateError with an empty top-level message.
function describeError(error: unknown): string {
  if (error instanceof AggregateError) {
    return error.errors.map(describeError).join("; ");
  }
  if (error instanceof Error) {
    return error.message || error.constructor.name;
  }
  return "unknown error";
}

const app = express();

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (error) {
    res.status(503).json({
      status: "error",
      db: "unreachable",
      message: describeError(error),
    });
  }
});

app.listen(port, () => {
  console.log(`[api] listening on port ${port}`);
});
