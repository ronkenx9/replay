import { mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

const root = resolve(import.meta.dirname, "..");
const frameDir = join(root, ".video-frames");
const output = join(root, "replay-demo.mp4");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const width = 1920;
const height = 1080;
const fps = 24;
const duration = 30;
const totalFrames = fps * duration;

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

await rm(frameDir, { recursive: true, force: true });
await mkdir(frameDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
  defaultViewport: { width, height, deviceScaleFactor: 1 },
  args: [
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--autoplay-policy=no-user-gesture-required",
  ],
});

try {
  const page = await browser.newPage();
  await page.goto(`file://${join(root, "demo-video.html")}`, { waitUntil: "networkidle0" });
  await page.addStyleTag({
    content: `
      .controls { display: none !important; }
      .scene { transition: none !important; }
      .node, .hero-device, .mini-panel.bad { animation-play-state: paused !important; }
    `,
  });
  await page.evaluate(() => document.fonts?.ready);

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const seconds = frame / fps;
    await page.evaluate((currentSeconds) => {
      const scenes = Array.from(document.querySelectorAll(".scene"));
      const durationSeconds = 30;
      const sceneDuration = durationSeconds / scenes.length;
      const index = Math.min(scenes.length - 1, Math.floor(currentSeconds / sceneDuration));
      const progress = document.querySelector(".progress-fill");
      const captionText = document.getElementById("captionText");
      const sceneLabel = document.getElementById("sceneLabel");
      const timecode = document.getElementById("timecode");
      const format = (value) => {
        const m = Math.floor(value / 60);
        const s = Math.floor(value % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      };

      scenes.forEach((scene, sceneIndex) => scene.classList.toggle("active", sceneIndex === index));
      if (progress) progress.style.width = `${(currentSeconds / durationSeconds) * 100}%`;
      if (captionText) captionText.textContent = scenes[index]?.dataset.caption || "";
      if (sceneLabel) sceneLabel.textContent = (scenes[index]?.dataset.scene || "scene").replace("-", " ");
      if (timecode) timecode.textContent = `${format(currentSeconds)} / ${format(durationSeconds)}`;
    }, seconds);

    await page.screenshot({
      path: join(frameDir, `frame-${String(frame).padStart(5, "0")}.jpg`),
      type: "jpeg",
      quality: 88,
    });

    if (frame % fps === 0) {
      console.log(`rendered ${Math.floor(seconds)}s / ${duration}s`);
    }
  }
} finally {
  await browser.close();
}

await run("/opt/homebrew/bin/ffmpeg", [
  "-y",
  "-framerate",
  String(fps),
  "-i",
  join(frameDir, "frame-%05d.jpg"),
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-r",
  "30",
  "-movflags",
  "+faststart",
  output,
]);

console.log(`Wrote ${output}`);
