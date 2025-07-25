// launcher.js
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 5001;

let flaskProcess = null;

app.get("/start", (req, res) => {
  if (flaskProcess) {
    return res.status(200).send("🔁 Server already running");
  }

  flaskProcess = spawn(
    "C:\\Users\\Ananya\\AppData\\Local\\Programs\\Python\\Python313\\python.exe",
    ["app.py"],
    {
      cwd: __dirname,
      shell: true,
    }
  );

  flaskProcess.stdout.on("data", (data) => {
    console.log(`[📢 flask] ${data}`);
  });

  flaskProcess.stderr.on("data", (data) => {
    console.error(`[❌ flask error] ${data}`);
  });

  flaskProcess.on("close", (code) => {
    console.log(`[☠️ flask exited] with code ${code}`);
    flaskProcess = null;
  });

  res.status(200).send("✅ Flask server started");
});

app.listen(PORT, () => {
  console.log(`🚀 Launcher listening on http://localhost:${PORT}`);
});
