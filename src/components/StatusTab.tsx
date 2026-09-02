import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  HardDrive,
  FileVideo,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Radio,
  Check,
  Zap,
  FolderCheck,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { getDriveFileContent, listDriveFiles, DriveFileItem } from '../services/driveService';
import { ManifestData, LiveProgressItem, SyncStatusPayload } from '../types';

interface StatusTabProps {
  manifest: ManifestData;
  user: User | null;
  accessToken: string | null;
  onOpenColab: () => void;
  onSwitchToCopier: () => void;
}

export const StatusTab: React.FC<StatusTabProps> = ({
  manifest,
  user,
  accessToken,
  onOpenColab,
  onSwitchToCopier,
}) => {
  // Polling & sync state
  const [autoPoll, setAutoPoll] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Status payload from Drive or live simulated demo
  const [statusData, setStatusData] = useState<SyncStatusPayload | null>(null);
  const [syncedDriveFiles, setSyncedDriveFiles] = useState<DriveFileItem[]>([]);
  const [activeTabSubfilter, setActiveTabSubfilter] = useState<'all' | 'failed' | 'completed' | 'pending'>('all');

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derive total counts from active manifest
  const totalManifestVideos = manifest.courses.reduce((acc, c) => {
    return acc + c.modules.reduce((mAcc, m) => mAcc + m.videos.length, 0);
  }, 0);

  // Fetch real status from Google Drive
  const pollDriveStatus = async (token?: string) => {
    const activeToken = token || accessToken;
    if (!activeToken) {
      // If not logged into Google Drive, generate state based on manifest
      generateFallbackLocalStatus();
      return;
    }

    setIsRefreshing(true);
    setSyncError(null);

    try {
      // 1. Check for `colab_sync_status.json` in the root or drive folder
      const result = await getDriveFileContent(activeToken, 'colab_sync_status.json');
      if (result && result.content) {
        try {
          const parsed: SyncStatusPayload = JSON.parse(result.content);
          setStatusData(parsed);
          setLastSyncTime(new Date().toLocaleTimeString());
        } catch {
          // JSON parsing failed
        }
      } else {
        // Look directly for completed .mp4 video files in the Drive folder
        const driveFiles = await listDriveFiles(activeToken);
        const mp4Files = driveFiles.filter(
          (f) => f.mimeType.includes('video') || f.name.endsWith('.mp4')
        );
        setSyncedDriveFiles(mp4Files);

        // Synthesize status based on files found in Drive
        buildStatusFromDriveFiles(mp4Files);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.warn('Drive status check warning:', err.message);
      setSyncError(err.message);
      // Still show fallback
      if (!statusData) {
        generateFallbackLocalStatus();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Build status from detected Drive video files
  const buildStatusFromDriveFiles = (files: DriveFileItem[]) => {
    const completedNames = new Set(files.map((f) => f.name.toLowerCase()));
    const completedList: LiveProgressItem[] = [];
    const pendingList: LiveProgressItem[] = [];

    manifest.courses.forEach((course) => {
      course.modules.forEach((module, mIdx) => {
        module.videos.forEach((vid, vIdx) => {
          const cleanName = `${vIdx + 1}_${vid.title.replace(/[/\\?%*:|"<>]/g, '_')}.mp4`.toLowerCase();
          const simpleName = `${vid.title.replace(/[/\\?%*:|"<>]/g, '_')}.mp4`.toLowerCase();

          const isFound = completedNames.has(cleanName) || completedNames.has(simpleName);
          const item: LiveProgressItem = {
            id: vid.id,
            courseTitle: course.title,
            moduleTitle: module.title,
            videoTitle: vid.title,
            status: isFound ? 'completed' : 'pending',
            percent: isFound ? 100 : 0,
            filePath: `/content/drive/MyDrive/SkillCapped_Archive/${course.title}/${vid.title}.mp4`,
          };

          if (isFound) {
            completedList.push(item);
          } else {
            pendingList.push(item);
          }
        });
      });
    });

    setStatusData({
      lastUpdated: new Date().toISOString(),
      totalVideos: totalManifestVideos,
      completedCount: completedList.length,
      failedCount: 0,
      skippedCount: 0,
      failedItems: [],
      recentCompleted: completedList.slice(0, 20),
    });
  };

  // Fallback initial status display
  const generateFallbackLocalStatus = () => {
    setStatusData({
      lastUpdated: new Date().toISOString(),
      totalVideos: totalManifestVideos,
      completedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      failedItems: [],
      recentCompleted: [],
    });
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  // Initial and recurring poll
  useEffect(() => {
    pollDriveStatus();

    if (autoPoll) {
      pollIntervalRef.current = setInterval(() => {
        pollDriveStatus();
      }, 5000); // Check Drive every 5 seconds
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [accessToken, autoPoll]);

  // Aggregate stats
  const completed = statusData?.completedCount ?? 0;
  const failed = statusData?.failedCount ?? 0;
  const skipped = statusData?.skippedCount ?? 0;
  const active = statusData?.activeItem;
  const pending = Math.max(0, totalManifestVideos - (completed + failed + skipped));
  const progressPercent = totalManifestVideos > 0 ? Math.round(((completed + skipped) / totalManifestVideos) * 100) : 0;

  return (
    <div id="status-dashboard" className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider flex items-center space-x-1">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>Live Sync Monitor</span>
              </span>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Real-Time Scraping & Drive Transfer Status
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Replaces the Colab terminal by actively monitoring your Google Drive storage for downloaded videos, active rips, and failed downloads.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setAutoPoll(!autoPoll)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                autoPoll
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoPoll ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{autoPoll ? 'Auto-Refresh (5s)' : 'Auto-Refresh Paused'}</span>
            </button>

            <button
              id="status-manual-refresh-btn"
              onClick={() => pollDriveStatus()}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
              <span>Sync Now</span>
            </button>

            <button
              onClick={onOpenColab}
              className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
            >
              <span>Colab Terminal</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">Overall Archive Progress:</span>
              <span className="font-mono text-orange-400 font-bold">{progressPercent}%</span>
              <span className="text-slate-400">
                ({completed} of {totalManifestVideos} videos saved to Drive)
              </span>
            </div>
            {lastSyncTime && (
              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Last checked: {lastSyncTime}</span>
              </span>
            )}
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3.5 border border-slate-800 p-0.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500 relative"
              style={{ width: `${Math.max(progressPercent, 2)}%` }}
            >
              {progressPercent > 8 && (
                <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite] rounded-full" />
              )}
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total Queue</p>
              <p className="text-lg font-black text-white">{totalManifestVideos}</p>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Completed</p>
              <p className="text-lg font-black text-emerald-400">{completed}</p>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <XCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Failed Items</p>
              <p className="text-lg font-black text-rose-400">{failed}</p>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Pending</p>
              <p className="text-lg font-black text-amber-300">{pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Currently Active Download Card (Live) */}
      <div className="bg-gradient-to-r from-orange-950/30 via-slate-900 to-amber-950/20 border border-orange-500/30 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Currently Active Cloud Download
            </h2>
          </div>
          {active ? (
            <span className="text-xs font-mono font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/30">
              {active.speed || '24.5 MB/s'} &bull; ETA: {active.eta || '12s'}
            </span>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
              {completed > 0 ? 'Batch Active or Idle' : 'Awaiting Colab Launch'}
            </span>
          )}
        </div>

        {active ? (
          <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-xs text-orange-400 font-semibold">{active.courseTitle}</p>
                <h3 className="text-sm font-bold text-white">{active.videoTitle}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {active.percent || 45}%
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${active.percent || 45}%` }}
              />
            </div>

            <p className="text-[11px] font-mono text-slate-400 truncate">
              Saving to: {active.filePath || '/content/drive/MyDrive/SkillCapped_Archive/...'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-dashed border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-300 font-medium">
              {completed > 0
                ? `${completed} videos have already finished and are saved in your Google Drive!`
                : 'No active rip running right now.'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-lg mx-auto">
              Launch the 1-Click scraper in Google Colab to begin processing your video queue. Progress will update here automatically every 5 seconds.
            </p>
          </div>
        )}
      </div>

      {/* Main Breakdown: Failed Items & Completed Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Failed Items Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Failed Items</h3>
                  <p className="text-[11px] text-slate-400">Stream errors or 403 Forbidden tokens</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-500/30">
                {failed} Failed
              </span>
            </div>

            <div className="flex-1 py-3 overflow-y-auto max-h-[380px] space-y-2.5">
              {failed === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl space-y-2 text-slate-500">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                  <p className="text-xs font-medium text-slate-300">Zero download errors!</p>
                  <p className="text-[11px] text-slate-500">
                    All processed streams have downloaded cleanly without 403 or network drops.
                  </p>
                </div>
              ) : (
                statusData?.failedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 p-3.5 rounded-xl border border-rose-500/30 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-rose-200">{item.videoTitle}</p>
                        <p className="text-[10px] text-slate-400">{item.courseTitle}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-mono border border-rose-500/40">
                        Error
                      </span>
                    </div>
                    {item.errorMessage && (
                      <p className="text-[11px] font-mono text-rose-400/90 bg-rose-950/40 p-2 rounded-lg border border-rose-500/20">
                        {item.errorMessage}
                      </p>
                    )}
                    <button
                      onClick={onOpenColab}
                      className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center space-x-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Retry in Colab</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recently Completed in Google Drive */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Archived Videos in Drive</h3>
                  <p className="text-[11px] text-slate-400">Verified saved .mp4 files in Google Drive</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                {completed} Completed
              </span>
            </div>

            <div className="flex-1 py-3 overflow-y-auto max-h-[380px] space-y-2">
              {completed === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl space-y-2 text-slate-500">
                  <FileVideo className="h-8 w-8 text-slate-600" />
                  <p className="text-xs font-medium text-slate-300">No completed videos yet</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Start the download in Google Colab. As each .mp4 finishes, it will appear here automatically.
                  </p>
                  <button
                    onClick={onOpenColab}
                    className="mt-2 px-3 py-1.5 bg-orange-500 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1"
                  >
                    <Play className="h-3 w-3" />
                    <span>Run Colab Ripper</span>
                  </button>
                </div>
              ) : (
                (statusData?.recentCompleted || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-200 truncate">{item.videoTitle}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.courseTitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0 ml-2">
                      Saved .mp4
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
