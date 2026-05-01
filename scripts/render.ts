import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import * as googleTTS from 'google-tts-api';

const TOTAL_FRAMES = 7500; // 25 beats * 300 frames
const FPS = 30;
const WIDTH = 1920; 
const HEIGHT = 1080;
const OUTPUT_DIR = path.join(process.cwd(), 'render_frames');
const AUDIO_DIR = path.join(process.cwd(), 'audio_temp');
const VIDEO_PATH = path.join(process.cwd(), 'immortal_clash.mp4');
const CONCURRENCY = 2;

const SCRIPT = [
  "In a world where pain doesn’t last… two men refuse to die.",
  "One is a weapon forged by war…",
  "The other? A weapon who won’t stop talking.",
  "Wolverine versus Deadpool.",
  "Wolverine. Adamantium claws. Animal instinct.",
  "Deadpool. Regenerating chaos in a red suit.",
  "Both heal. Both kill. But they couldn’t be more different.",
  "Wolverine fights with precision. Deadpool fights like the rules don’t exist.",
  "And maybe… they don’t.",
  "Steel clashes. Bullets fly. Claws meet katanas.",
  "Wolverine charges. Feral. Relentless.",
  "Deadpool dodges. Laughing. Talking. Never serious.",
  "Limbs get torn. Bones break. But seconds later… they’re back.",
  "Again. And again. And again.",
  "Here’s the problem.",
  "You can’t outlast someone… who refuses to stay down.",
  "Wolverine’s rage fuels him. Deadpool’s insanity frees him.",
  "One fights to end it. The other? Just enjoys the chaos.",
  "So who wins?",
  "In strength and combat skill, Wolverine has the edge.",
  "In unpredictability and sheer absurd endurance, Deadpool takes it.",
  "But in truth? There is no winner.",
  "Because when two immortals fight… the battle never ends.",
  "Different codes. Same curse.",
  "Wolverine versus Deadpool. Not a fight to win. A fight that never stops."
];

async function generateAudio() {
  console.log('🎙️ Generating Voiceover clips...');
  await fs.ensureDir(AUDIO_DIR);
  
  for (let i = 0; i < SCRIPT.length; i++) {
    const url = googleTTS.getAudioUrl(SCRIPT[i], {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
    });
    
    // Download clip
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(path.join(AUDIO_DIR, `beat_${i.toString().padStart(2, '0')}.mp3`), buffer);
  }
}

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
  await generateAudio();
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

  console.log('🎞️ Encoding video with Audio Mix...');
  
  if (!ffmpegPath) {
     throw new Error('FFmpeg not found');
  }

  const audioInputs: string[] = [];
  let filterComplex = '';
  for (let i = 0; i < SCRIPT.length; i++) {
    audioInputs.push('-i', path.join(AUDIO_DIR, `beat_${i.toString().padStart(2, '0')}.mp3`));
    // Delay each clip by 10s (beat duration)
    filterComplex += `[${i + 1}:a]adelay=${i * 10000}|${i * 10000}[a${i}];`;
  }
  const amixInputs = SCRIPT.map((_, i) => `[a${i}]`).join('');
  filterComplex += `${amixInputs}amix=inputs=${SCRIPT.length}[outa]`;

  const ffmpegArgs = [
    '-y',
    '-framerate', FPS.toString(),
    '-i', path.join(OUTPUT_DIR, 'frame_%05d.jpg'),
    ...audioInputs,
    '-filter_complex', filterComplex,
    '-map', '0:v',
    '-map', '[outa]',
    '-c:v', 'libx264',
    '-preset', 'slower',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    VIDEO_PATH
  ];

  const ffmpeg = spawn(ffmpegPath, ffmpegArgs);

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

  // Cleanup
  await fs.remove(OUTPUT_DIR);
  await fs.remove(AUDIO_DIR);
}

render().catch(err => {
  console.error('❌ Render failed:', err);
  process.exit(1);
});
