import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const TOTAL_FRAMES = 6600;
const FPS = 30;
const WIDTH = 1920; // 1080p for faster rendering in CI, can be 3840 for 4K
const HEIGHT = 1080;
const OUTPUT_DIR = path.join(process.cwd(), 'render_frames');
const VIDEO_PATH = path.join(process.cwd(), 'why_night_has_no_blue.mp4');

async function render() {
  console.log('🚀 Starting video render...');

  // Ensure output dir is empty
  await fs.emptyDir(OUTPUT_DIR);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: WIDTH, height: HEIGHT }
  });

  const page = await browser.newPage();
  
  // Navigate to the app in render mode
  // Assuming the dev server is running on port 3000
  await page.goto('http://localhost:3000?mode=render', { waitUntil: 'networkidle0' });

  // Wait for the app to signal it's ready
  await page.waitForFunction(() => (window as any).renderReady === true);

  console.log(`📸 Capturing ${TOTAL_FRAMES} frames...`);

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    // Progress update every 100 frames
    if (i % 100 === 0) {
      console.log(`Frame ${i}/${TOTAL_FRAMES} (${Math.round((i/TOTAL_FRAMES) * 100)}%)`);
    }

    // Set the specific frame
    await page.evaluate((f) => {
      (window as any).setAnimationFrame(f);
    }, i);

    // Give a tiny bit of time for React to update and layout to settle
    await new Promise(r => setTimeout(r, 20));

    // Save screenshot
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `frame_${i.toString().padStart(5, '0')}.png`),
      type: 'png'
    });
  }

  await browser.close();

  console.log('🎞️ Encoding video with FFmpeg...');
  
  if (!ffmpegPath) {
     throw new Error('FFmpeg not found');
  }

  const ffmpeg = spawn(ffmpegPath, [
    '-y',
    '-framerate', FPS.toString(),
    '-i', path.join(OUTPUT_DIR, 'frame_%05d.png'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '18', // High quality
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
