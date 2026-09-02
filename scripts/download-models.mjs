import fs from 'fs';
import path from 'path';
import https from 'https';

const BASE_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
const TARGET_DIR = path.join(process.cwd(), 'public', 'models');

const MODEL_FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

function downloadFile(url, destPath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }

    const request = https.get(url, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        const redirectUrl = new URL(response.headers.location, url).toString();
        response.resume();
        return downloadFile(redirectUrl, destPath, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(
          new Error(`Failed to download: Status Code ${response.statusCode}`)
        );
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => resolve());
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    request.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('Target directory:', TARGET_DIR);

  if (!fs.existsSync(TARGET_DIR)) {
    console.log('Creating directory:', TARGET_DIR);
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  let downloadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < MODEL_FILES.length; i++) {
    const fileName = MODEL_FILES[i];
    const fileUrl = `${BASE_URL}${fileName}`;
    const destPath = path.join(TARGET_DIR, fileName);

    const progress = `[${i + 1}/${MODEL_FILES.length}]`;

    if (fs.existsSync(destPath)) {
      console.log(`${progress} Skipping (already exists): ${fileName}`);
      skippedCount++;
      continue;
    }

    console.log(`${progress} Downloading: ${fileName}...`);
    try {
      await downloadFile(fileUrl, destPath);
      console.log(`${progress} Successfully downloaded: ${fileName}`);
      downloadedCount++;
    } catch (err) {
      console.error(`${progress} Failed to download ${fileName}: ${err.message}`);
      failedCount++;
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Downloaded: ${downloadedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during download:', err);
  process.exit(1);
});
