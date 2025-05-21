import app from "./api";

// Start the server
Bun.serve({
  hostname: "0.0.0.0",
  port: 3000,
  fetch: app.fetch,
});

console.log("Server is running on http://localhost:3000");