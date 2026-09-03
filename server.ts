import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper: Ensure yt-dlp is executable
function getYtDlpPath(): string {
  if (fs.existsSync('/usr/local/bin/yt-dlp')) {
    return '/usr/local/bin/yt-dlp';
  }
  if (fs.existsSync('/tmp/yt-dlp')) {
    return '/tmp/yt-dlp';
  }
  return 'yt-dlp';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'video';
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const ytdlpPath = getYtDlpPath();
  const ytdlpOk = fs.existsSync(ytdlpPath);
  const ffmpegOk = fs.existsSync('/usr/bin/ffmpeg');
  res.json({
    status: 'ok',
    ytdlpAvailable: ytdlpOk,
    ffmpegAvailable: ffmpegOk,
    timestamp: new Date().toISOString(),
  });
});

// Stream Probe Endpoint
app.post('/api/probe-stream', async (req, res) => {
  const { url, cookiesTxt } = req.body;
  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  const tempDir = path.join(os.tmpdir(), `probe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const cookiesFile = path.join(tempDir, 'cookies.txt');

  try {
    const ytdlp = getYtDlpPath();
    const args = ['--dump-json', '--no-warnings', '--skip-download'];

    if (cookiesTxt && cookiesTxt.trim().length > 20) {
      fs.writeFileSync(cookiesFile, cookiesTxt, 'utf-8');
      args.push('--cookies', cookiesFile);
    }

    args.push(url);

    const child = spawn(ytdlp, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      // Clean up
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore
      }

      if (code === 0 && stdout.trim()) {
        try {
          const info = JSON.parse(stdout.trim());
          res.json({
            title: info.title || 'Extracted Video',
            duration: info.duration ? `${Math.floor(info.duration / 60)}:${String(Math.floor(info.duration % 60)).padStart(2, '0')}` : 'Unknown',
            resolution: info.resolution || (info.height ? `${info.height}p` : '1080p'),
            formats: Array.isArray(info.formats) ? info.formats.length : 1,
            filesizeEstimate: info.filesize ? `${(info.filesize / (1024 * 1024)).toFixed(1)} MB` : 'Dynamic Stream',
          });
          return;
        } catch {
          // fall through
        }
      }

      res.status(422).json({
        error: stderr.trim() || 'Could not extract stream metadata from URL.',
      });
    });
  } catch (err: any) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    res.status(500).json({ error: err.message || 'Probe execution failed.' });
  }
});

// Core API: Download actual video binary and upload directly to Google Drive
app.post('/api/transfer-video', async (req, res) => {
  const {
    videoUrl,
    videoTitle,
    courseTitle,
    moduleTitle,
    driveAccessToken,
    driveFolderId,
    cookiesTxt,
    videoQuality = 'best',
  } = req.body;

  if (!videoUrl) {
    res.status(400).json({ error: 'videoUrl is required' });
    return;
  }
  if (!driveAccessToken) {
    res.status(400).json({ error: 'driveAccessToken is required' });
    return;
  }

  const jobId = `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const jobDir = path.join(os.tmpdir(), jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const cookiesFile = path.join(jobDir, 'cookies.txt');
  const outputTemplate = path.join(jobDir, 'video.%(ext)s');

  console.log(`[Transfer ${jobId}] Starting video scrape & transfer for "${videoTitle}" from: ${videoUrl}`);

  try {
    // 1. Write cookies if present
    if (cookiesTxt && typeof cookiesTxt === 'string' && cookiesTxt.trim().length > 20) {
      fs.writeFileSync(cookiesFile, cookiesTxt, 'utf-8');
    }

    // Determine target candidate URLs to try
    const candidateUrls: string[] = [];
    if (videoUrl.includes('.m3u8') || videoUrl.includes('.mp4')) {
      candidateUrls.push(videoUrl);
    } else {
      // If it's a course webpage URL like https://www.skill-capped.com/lol/browse/course/t2w4xq8fhc/9199rq2gcs
      // extract the video UUID
      const match = videoUrl.match(/\/([a-zA-Z0-9]{8,32})\/?$/);
      if (match && match[1]) {
        const uuid = match[1];
        candidateUrls.push(`https://www.skill-capped.com/api/video/${uuid}.m3u8`);
        candidateUrls.push(`https://d13z5uuzt1wkbz.cloudfront.net/video/${uuid}.m3u8`);
        candidateUrls.push(`https://d20k8dfo6rtj2t.cloudfront.net/video/${uuid}.m3u8`);
        candidateUrls.push(`https://manifest.prod.skill-capped.com/hls/videos/${uuid}.m3u8`);
      }
      candidateUrls.push(videoUrl);
    }

    const ytdlp = getYtDlpPath();
    let downloadedFilePath = path.join(jobDir, 'video.mp4');
    let fileExists = false;
    let lastError = '';

    for (const targetUrl of candidateUrls) {
      if (fileExists) break;
      console.log(`[Transfer ${jobId}] Attempting stream extraction with: ${targetUrl}`);

      const args = [
        targetUrl,
        '-o', outputTemplate,
        '--merge-output-format', 'mp4',
        '--no-check-certificates',
        '--retries', '3',
        '--fragment-retries', '5',
        '--buffer-size', '16M',
        '--add-header', 'Referer: https://www.skill-capped.com/',
        '--add-header', 'Origin: https://www.skill-capped.com',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      ];

      if (fs.existsSync(cookiesFile)) {
        args.push('--cookies', cookiesFile);
      }

      if (videoQuality === '1080p') {
        args.push('-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best');
      } else if (videoQuality === '720p') {
        args.push('-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]/best');
      } else {
        args.push('-f', 'bestvideo+bestaudio/best');
      }

      const child = spawn(ytdlp, args);
      let stderr = '';
      await new Promise<{ code: number }>((resolve) => {
        child.stderr.on('data', (d) => { stderr += d.toString(); });
        child.on('close', (c) => resolve({ code: c ?? 1 }));
      });

      if (fs.existsSync(downloadedFilePath)) {
        fileExists = true;
      } else {
        const files = fs.readdirSync(jobDir);
        const videoMatch = files.find((f) => f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.webm') || f.endsWith('.ts'));
        if (videoMatch) {
          downloadedFilePath = path.join(jobDir, videoMatch);
          fileExists = true;
        } else {
          lastError = stderr;
        }
      }
    }

    // Fallback: If yt-dlp failed but videoUrl is an m3u8 playlist, try ffmpeg direct rip
    if (!fileExists && videoUrl.includes('.m3u8')) {
      console.log(`[Transfer ${jobId}] yt-dlp did not output file, falling back to direct ffmpeg demuxing for m3u8...`);
      const ffmpegArgs = [
        '-i', videoUrl,
        '-c', 'copy',
        '-bsf:a', 'aac_adtstoasc',
        '-y',
        path.join(jobDir, 'video.mp4')
      ];
      if (fs.existsSync(cookiesFile)) {
        ffmpegArgs.unshift('-headers', `Cookie: ${cookiesTxt.replace(/\n/g, '; ')}\r\n`);
      }

      await new Promise<void>((resolve) => {
        const ff = spawn('/usr/bin/ffmpeg', ffmpegArgs);
        ff.on('close', () => resolve());
      });

      downloadedFilePath = path.join(jobDir, 'video.mp4');
      fileExists = fs.existsSync(downloadedFilePath);
    }

    // CRITICAL: Verify the file is an actual video, NOT an empty stub or error page
    if (!fileExists) {
      const errMsg = lastError.trim() || 'No video stream could be captured from the URL.';
      throw new Error(`Video extraction failed: ${errMsg}. Please verify your SkillCapped session cookies are active.`);
    }

    const fileStat = fs.statSync(downloadedFilePath);
    const fileSize = fileStat.size;

    // Genuine video files are at least 100 KB (usually 10MB - 500MB+)
    if (fileSize < 50 * 1024) {
      throw new Error(`Downloaded file is only ${(fileSize / 1024).toFixed(1)} KB (expected multi-megabyte video stream). Authentication session may have expired.`);
    }

    console.log(`[Transfer ${jobId}] Real video file verified! Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB. Initiating Google Drive upload...`);

    // 3. Upload real binary video file to Google Drive using Google Drive Resumable Upload
    const targetFilename = `${sanitizeFilename(videoTitle || 'SkillCapped_Lesson')}.mp4`;

    // Step A: Initiate resumable session
    const metaPayload: Record<string, any> = {
      name: targetFilename,
      description: `Archived from SkillCapped: ${courseTitle || ''} - ${moduleTitle || ''}`,
    };
    if (driveFolderId) {
      metaPayload.parents = [driveFolderId];
    }

    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${driveAccessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(fileSize),
      },
      body: JSON.stringify(metaPayload),
    });

    if (!initRes.ok) {
      const errText = await initRes.text();
      throw new Error(`Google Drive upload initiation failed (${initRes.status}): ${errText}`);
    }

    const uploadLocation = initRes.headers.get('Location') || initRes.headers.get('location');
    if (!uploadLocation) {
      throw new Error('Google Drive API did not return an upload location URL.');
    }

    // Step B: Stream the local video binary into the resumable upload URL
    const fileStream = fs.createReadStream(downloadedFilePath);
    const uploadRes = await fetch(uploadLocation, {
      method: 'PUT',
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
      },
      body: fileStream as any,
      // @ts-ignore - duplex is needed for node fetch with stream body
      duplex: 'half',
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Google Drive binary upload failed (${uploadRes.status}): ${errText}`);
    }

    const driveFileData = (await uploadRes.json()) as any;
    console.log(`[Transfer ${jobId}] SUCCESS! Uploaded ${targetFilename} (${(fileSize / (1024 * 1024)).toFixed(2)} MB) -> Drive File ID: ${driveFileData.id}`);

    res.json({
      success: true,
      fileId: driveFileData.id,
      fileName: targetFilename,
      sizeBytes: fileSize,
      sizeFormatted: `${(fileSize / (1024 * 1024)).toFixed(1)} MB`,
      webViewLink: driveFileData.webViewLink || `https://drive.google.com/file/d/${driveFileData.id}/view`,
    });
  } catch (err: any) {
    console.error(`[Transfer ${jobId}] FAILED:`, err.message);
    res.status(500).json({ error: err.message || 'Internal transfer error' });
  } finally {
    // 4. Always clean up temporary video files so the container storage never fills up
    try {
      fs.rmSync(jobDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

// Vite middleware & SPA fallback
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
