import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const TOTAL_FRAMES = 6600;
const FPS = 30;
const WIDTH = 1920; 
const HEIGHT = 1080;
const OUTPUT_DIR = path.join(process.cwd(), 'render_frames');
const VIDEO_PATH = path.join(process.cwd(), 'why_night_has_no_blue.mp4');
const CONCURRENCY = 2; // GitHub runners have 2 cores, 2 workers is optimal

async function renderWorker(workerId: number, startFrame: number, endFrame: number, appUrl: string) {
  console.log(`[Worker ${workerId}] Starting frames ${startFrame} to ${endFrame}...`);
  
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: WIDTH, height: HEIGHT }
  });

  const page = await browser.newPage();
  await page.goto(appUrl, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => (window as any).renderReady === true);

  for (let i = startFrame; i <= endFrame; i++) {
    if (i % 50 === 0) {
      console.log(`[Worker ${workerId}] Frame ${i}/${endFrame}`);
    }

    await page.evaluate(async (f) => {
      (window as any).setAnimationFrame(f);
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    }, i);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `frame_${i.toString().padStart(5, '0')}.jpg`),
      type: 'jpeg',
      quality: 90
    });
  }

  await browser.close();
  console.log(`[Worker ${workerId}] Finished.`);
}

async function render() {
  console.log('🚀 Starting Parallel Video Render...');
  await fs.ensureDir(OUTPUT_DIR);

  const appUrl = 'http://localhost:3000?mode=render';
  const framesPerWorker = Math.ceil(TOTAL_FRAMES / CONCURRENCY);
  const workers = [];

  for (let i = 0; i < CONCURRENCY; i++) {
    const start = i * framesPerWorker;
    const end = Math.min(start + framesPerWorker - 1, TOTAL_FRAMES - 1);
    workers.push(renderWorker(i, start, end, appUrl));
  }

  await Promise.all(workers);

  console.log('🎞️ Encoding video with FFmpeg...');
  // ... rest of the encoding logic
  
  if (!ffmpegPath) {
     throw new Error('FFmpeg not found');
  }

  const ffmpeg = spawn(ffmpegPath, [
    '-y',
    '-framerate', FPS.toString(),
    '-i', path.join(OUTPUT_DIR, 'frame_%05d.jpg'),
    '-c:v', 'libx264',
    '-preset', 'slower', // Use slower preset for better compression since we are already waiting
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    VIDEO_PATH
  ]);

  ffmpeg.stdout.on('data', (data) => console.log(`FFmpeg: ${data}`));
  ffmpeg.stderr.on('data', (data) => console.log(`FFmpeg Error: ${data}`));

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Success! Video rendered to: ${VIDEO_PATH}`);
        resolve(true);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });

  // Cleanup frames
  await fs.remove(OUTPUT_DIR);
}

render().catch(err => {
  console.error('❌ Render failed:', err);
  process.exit(1);
});
