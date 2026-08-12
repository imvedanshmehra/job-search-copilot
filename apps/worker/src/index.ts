console.log("[worker] started");

// No scheduling yet — node-cron wiring lands in Phase 6.
// This keeps the process alive so `pnpm dev` can run it as a persistent task.
setInterval(() => {}, 60 * 60 * 1000);
