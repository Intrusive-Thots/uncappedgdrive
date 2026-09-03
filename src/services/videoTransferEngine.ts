import { ManifestData, CourseItem } from '../types';
import { getOrCreateFolder, uploadFileToDrive } from './driveService';

export interface VideoTransferTask {
  id: string;
  videoTitle: string;
  courseTitle: string;
  moduleTitle: string;
  role?: string;
  url: string;
  status: 'pending' | 'downloading' | 'uploading' | 'completed' | 'failed';
  progress: number;
  speed?: string;
  eta?: string;
  error?: string;
  driveFileId?: string;
  sizeBytes?: number;
  completedAt?: string;
}

export interface VideoTransferStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  percent: number;
  activeTask?: VideoTransferTask | null;
  activeTasks: VideoTransferTask[];
  concurrency: number;
  isRunning: boolean;
  lastUpdated: string;
}

export type ProgressCallback = (stats: VideoTransferStats, task?: VideoTransferTask) => void;

export function detectRoleFromText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('{mid}') || lower.includes('mid lane') || lower.includes('mid-lane')) return 'Mid';
  if (lower.includes('{adc}') || lower.includes('adc') || lower.includes('bot lane') || lower.includes('marksman')) return 'ADC';
  if (lower.includes('{top}') || lower.includes('top lane') || lower.includes('top-lane')) return 'Top';
  if (lower.includes('{jungle}') || lower.includes('jungle') || lower.includes('jungler')) return 'Jungle';
  if (lower.includes('{support}') || lower.includes('support')) return 'Support';
  return 'Fundamentals';
}

class VideoTransferManager {
  private queue: VideoTransferTask[] = [];
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;
  private listeners: ProgressCallback[] = [];
  private concurrency: number = 2;
  private folderCache: Record<string, string> = {};

  public detectRole(course: string, module: string, video: string): string {
    return detectRoleFromText(`${course} ${module} ${video}`);
  }

  public setConcurrency(val: number) {
    this.concurrency = Math.max(1, Math.min(4, val));
    this.notify();
  }

  public getConcurrency(): number {
    return this.concurrency;
  }

  public subscribe(cb: ProgressCallback): () => void {
    this.listeners.push(cb);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(activeTask?: VideoTransferTask) {
    const stats = this.getStats();
    this.listeners.forEach((cb) => cb(stats, activeTask || stats.activeTask || undefined));
  }

  public getStats(): VideoTransferStats {
    const completed = this.queue.filter((t) => t.status === 'completed').length;
    const failed = this.queue.filter((t) => t.status === 'failed').length;
    const total = this.queue.length;
    const pending = total - (completed + failed);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const activeTasks = this.queue.filter((t) => t.status === 'downloading' || t.status === 'uploading');
    const activeTask = activeTasks[0] || null;

    return {
      total,
      completed,
      failed,
      pending,
      percent,
      activeTask,
      activeTasks,
      concurrency: this.concurrency,
      isRunning: this.isRunning,
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }

  public getQueue(): VideoTransferTask[] {
    return [...this.queue];
  }

  public initFromManifest(manifest: ManifestData) {
    if (this.isRunning) return;

    const newQueue: VideoTransferTask[] = [];
    manifest.courses.forEach((course) => {
      if (course.selected === false) return;
      (course.modules || []).forEach((module, mIdx) => {
        (module.videos || []).forEach((video, vIdx) => {
          if (video.selected === false) return;
          const detectedRole = detectRoleFromText(`${course.title} ${module.title} ${video.title}`);
          newQueue.push({
            id: video.id || `vid-${course.id}-${mIdx}-${vIdx}`,
            videoTitle: video.title,
            courseTitle: course.title,
            moduleTitle: module.title,
            role: detectedRole,
            url: video.url || '',
            status: 'pending',
            progress: 0,
          });
        });
      });
    });

    this.queue = newQueue;
    this.notify();
  }

  public async startTransfer(accessToken: string, cookiesRaw?: string) {
    if (this.isRunning) return;
    if (!accessToken) throw new Error('Google Drive authentication is required.');
    if (this.queue.length === 0) throw new Error('No videos queued in the manifest.');

    this.isRunning = true;
    this.abortController = new AbortController();
    this.notify();

    try {
      // 1. Ensure Root Archive Folder in Google Drive
      const rootFolder = await getOrCreateFolder(accessToken, 'SkillCapped_Archive');

      // Worker pool for parallel processing
      const executeNextTask = async (): Promise<void> => {
        while (!this.abortController?.signal.aborted) {
          // Find next pending task
          const task = this.queue.find((t) => t.status === 'pending');
          if (!task) break;

          task.status = 'downloading';
          task.progress = 25;
          task.speed = 'Extracting stream...';
          task.eta = 'Resolving';
          this.notify(task);

          try {
            // Check folder cache for course subfolder
            let courseFolderId = this.folderCache[task.courseTitle];
            if (!courseFolderId) {
              const cleanCourse = task.courseTitle.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'Course';
              const courseFolder = await getOrCreateFolder(accessToken, cleanCourse, rootFolder.id);
              courseFolderId = courseFolder.id;
              this.folderCache[task.courseTitle] = courseFolderId;
            }

            task.progress = 50;
            task.speed = 'Downloading & muxing MP4...';
            this.notify(task);

            const res = await fetch('/api/transfer-video', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: this.abortController?.signal,
              body: JSON.stringify({
                videoUrl: task.url,
                videoTitle: task.videoTitle,
                courseTitle: task.courseTitle,
                moduleTitle: task.moduleTitle,
                driveAccessToken: accessToken,
                driveFolderId: courseFolderId,
                cookiesTxt: cookiesRaw || '',
              }),
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
              throw new Error(errData.error || `Transfer engine returned HTTP ${res.status}`);
            }

            const result = await res.json();
            task.status = 'completed';
            task.progress = 100;
            task.driveFileId = result.fileId;
            task.sizeBytes = result.sizeBytes;
            task.speed = result.sizeFormatted;
            task.completedAt = new Date().toLocaleTimeString();
            task.error = undefined;
          } catch (err: any) {
            if (this.abortController?.signal.aborted) {
              task.status = 'pending';
              task.progress = 0;
            } else {
              task.status = 'failed';
              task.error = err.message || 'Transfer failed';
            }
          }

          this.notify(task);
        }
      };

      // Launch concurrent worker promises
      const numWorkers = Math.min(this.concurrency, this.queue.filter((t) => t.status === 'pending').length || 1);
      const workers = Array.from({ length: numWorkers }, () => executeNextTask());
      await Promise.all(workers);
    } finally {
      this.isRunning = false;
      this.notify();
    }
  }

  public pauseTransfer() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isRunning = false;
    this.notify();
  }

  public retryAllFailed(accessToken: string, cookiesRaw?: string) {
    this.queue.forEach((t) => {
      if (t.status === 'failed') {
        t.status = 'pending';
        t.progress = 0;
        t.error = undefined;
      }
    });
    this.notify();
    if (!this.isRunning) {
      this.startTransfer(accessToken, cookiesRaw);
    }
  }

  public retryTask(taskId: string, accessToken: string, cookiesRaw?: string) {
    const task = this.queue.find((t) => t.id === taskId);
    if (task) {
      task.status = 'pending';
      task.progress = 0;
      task.error = undefined;
      this.notify(task);
      if (!this.isRunning) {
        this.startTransfer(accessToken, cookiesRaw);
      }
    }
  }

  public clearQueue() {
    if (this.isRunning) this.pauseTransfer();
    this.queue = [];
    this.notify();
  }
}

export const videoTransferEngine = new VideoTransferManager();
