export interface VideoItem {
  id: string;
  title: string;
  url: string;
  duration?: number | string;
  resolution?: string;
  thumbnailUrl?: string;
  moduleIndex?: number;
  moduleTitle?: string;
  courseIndex?: number;
  courseTitle?: string;
  streamType?: 'm3u8' | 'mp4' | 'dash' | 'direct';
  headers?: Record<string, string>;
  selected?: boolean;
}

export interface ModuleItem {
  id: string;
  title: string;
  index: number;
  videos: VideoItem[];
}

export interface CourseItem {
  id: string;
  title: string;
  game?: string;
  instructor?: string;
  totalDuration?: string;
  modules: ModuleItem[];
  selected?: boolean;
}

export interface ManifestData {
  courses: CourseItem[];
  metadata?: {
    exportedAt?: string;
    source?: string;
    version?: string;
    totalVideos?: number;
    authenticatedUser?: string;
  };
}

export interface CookieEntry {
  domain: string;
  flag: boolean;
  path: string;
  secure: boolean;
  expiration: number;
  name: string;
  value: string;
  isHttpOnly?: boolean;
  isValid?: boolean;
}

export interface ArchiverConfig {
  driveBasePath: string;
  folderStructure: '{course_title}/{module_index}_{module_title}/{video_index}_{video_title}';
  downloadEngine: 'aria2c' | 'standard' | 'ffmpeg';
  concurrentDownloads: number;
  aria2Connections: number;
  videoQuality: 'best' | '1080p' | '720p' | 'source' | 'audio_only';
  enableArchiveLog: boolean;
  archiveLogFileName: string;
  embedSubtitles: boolean;
  embedMetadata: boolean;
  embedThumbnail: boolean;
  rateLimit: string;
  retryAttempts: number;
  retrySleepSeconds: number;
  useCustomCookies: boolean;
  cookiesFileName: string;
  manifestFileName: string;
  autoUnmountOnFinish: boolean;
  notifyOnFinish: boolean;
  targetUrlsFileName: string;
  scrapeCoursePagesDirectly: boolean;
  extractResolution: 'best' | '1080p' | '720p';
}

export interface ScraperLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  stage?: 'cookies' | 'manifest' | 'targets' | 'scraping' | 'packaging';
}

export interface ScrapedVideoCandidate {
  id: string;
  title: string;
  url: string;
  resolution?: string;
  duration?: string;
  streamType?: 'm3u8' | 'mp4' | 'dash';
  courseTitle?: string;
  moduleTitle?: string;
  foundIn: string;
  authenticated: boolean;
}

export interface JupyterCell {
  cell_type: 'code' | 'markdown';
  metadata: Record<string, any>;
  source: string[];
  execution_count?: number | null;
  outputs?: any[];
}

export interface JupyterNotebook {
  nbformat: number;
  nbformat_minor: number;
  metadata: {
    colab?: {
      provenance: any[];
      toc_visible?: boolean;
    };
    kernelspec: {
      name: string;
      display_name: string;
    };
    language_info: {
      name: string;
    };
  };
  cells: JupyterCell[];
}

export interface LiveProgressItem {
  id: string;
  courseTitle: string;
  moduleTitle: string;
  videoTitle: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'skipped';
  percent?: number;
  speed?: string;
  eta?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  filePath?: string;
  errorMessage?: string;
  timestamp?: string;
}

export interface SyncStatusPayload {
  sessionStarted?: string;
  lastUpdated: string;
  totalVideos: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  activeItem?: LiveProgressItem;
  failedItems: LiveProgressItem[];
  recentCompleted: LiveProgressItem[];
}
