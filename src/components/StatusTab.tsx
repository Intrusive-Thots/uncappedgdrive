import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  HardDrive,
  FileVideo,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  FolderCheck,
  Zap,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { listDriveFiles, DriveFileItem } from '../services/driveService';
import { ManifestData } from '../types';
import {
  videoTransferEngine,
  VideoTransferStats,
  VideoTransferTask,
} from '../services/videoTransferEngine';

interface StatusTabProps {
  manifest: ManifestData;
  user: User | null;
  accessToken: string | null;
  cookiesRaw?: string;
  onSwitchToCopier: () => void;
}

export const StatusTab: React.FC<StatusTabProps> = ({
  manifest,
  user,
  accessToken,
  cookiesRaw,
  onSwitchToCopier,
}) => {
  const [transferStats, setTransferStats] = useState<VideoTransferStats>(
    videoTransferEngine.getStats()
  );
  const [queue, setQueue] = useState<VideoTransferTask[]>(videoTransferEngine.getQueue());
  const [syncedDriveFiles, setSyncedDriveFiles] = useState<DriveFileItem[]>([]);
  const [isRefreshingDrive, setIsRefreshingDrive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'failed' | 'pending'>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to in-app transfer engine updates
  useEffect(() => {
    const unsubscribe = videoTransferEngine.subscribe((stats) => {
      setTransferStats(stats);
      setQueue(videoTransferEngine.getQueue());
    });
    return () => unsubscribe();
  }, []);

  // Poll Google Drive files if accessToken exists
  const checkDriveFiles = async () => {
    if (!accessToken) return;
    setIsRefreshingDrive(true);
    try {
      const files = await listDriveFiles(accessToken);
      const mp4s = files.filter(
        (f) => f.mimeType.includes('video') || f.name.endsWith('.mp4') || f.name.endsWith('.json')
      );
      setSyncedDriveFiles(mp4s);
    } catch {
      // ignore
    } finally {
      setIsRefreshingDrive(false);
    }
  };

  useEffect(() => {
    checkDriveFiles();
    const interval = setInterval(checkDriveFiles, 10000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const handleStartOrResume = () => {
    if (!accessToken) {
      onSwitchToCopier();
      return;
    }
    videoTransferEngine.startTransfer(accessToken, cookiesRaw);
  };

  const handlePause = () => {
    videoTransferEngine.pauseTransfer();
  };

  const handleRetryTask = (taskId: string) => {
    if (!accessToken) {
      onSwitchToCopier();
      return;
    }
    videoTransferEngine.retryTask(taskId, accessToken, cookiesRaw);
  };

  const handleClear = () => {
    videoTransferEngine.clearQueue();
  };

  // Filter tasks
  const filteredTasks = queue.filter((t) => {
    if (activeFilter === 'completed' && t.status !== 'completed') return false;
    if (activeFilter === 'failed' && t.status !== 'failed') return false;
    if (activeFilter === 'pending' && (t.status === 'completed' || t.status === 'failed')) return false;

    if (selectedRole !== 'all' && t.role !== selectedRole) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.videoTitle.toLowerCase().includes(q) ||
        t.courseTitle.toLowerCase().includes(q) ||
        t.moduleTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">Live Transfer & Drive Status</h2>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                  transferStats.isRunning
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {transferStats.isRunning ? 'Scraping Active' : 'Idle'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time in-app scraper progress, active queue, and verified Google Drive archives.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {transferStats.isRunning ? (
            <button
              onClick={handlePause}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow transition"
            >
              <Pause className="h-3.5 w-3.5 fill-slate-950" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleStartOrResume}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow transition"
            >
              <Play className="h-3.5 w-3.5 fill-slate-950" />
              <span>Start / Resume</span>
            </button>
          )}

          <button
            onClick={checkDriveFiles}
            disabled={isRefreshingDrive}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 transition"
            title="Refresh Google Drive files"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshingDrive ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Queued</span>
            <FileVideo className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{transferStats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {transferStats.percent}% complete
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {transferStats.completed}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Direct to Drive
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>Pending</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{transferStats.pending}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {transferStats.isRunning ? 'In progress' : 'Ready to scrape'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-rose-400">
              <span>Failed</span>
              <XCircle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">{transferStats.failed}</div>
          </div>
          {transferStats.failed > 0 && (
            <button
              onClick={() => videoTransferEngine.retryAllFailed(accessToken || '', cookiesRaw)}
              className="mt-2 w-full py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Retry All Failed</span>
            </button>
          )}
        </div>
      </div>

      {/* Speed & Concurrency Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-orange-400" />
          <span className="text-slate-300 font-semibold">Transfer Concurrency:</span>
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => videoTransferEngine.setConcurrency(num)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  transferStats.concurrency === num
                    ? 'bg-orange-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {num === 1 ? '1x (Safe)' : num === 2 ? '2x (Parallel)' : '3x (Fast)'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Active Workers:</span>
          <span className="font-mono text-emerald-400 font-bold">
            {transferStats.activeTasks?.length || 0} / {transferStats.concurrency}
          </span>
        </div>
      </div>

      {/* Progress Bar & Current Operation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Overall Transfer Progress</span>
          <span className="font-mono text-orange-400 font-bold">{transferStats.percent}%</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${transferStats.percent}%` }}
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 pt-1 font-mono">
          <div>
            Active Item:{' '}
            <span className="text-white font-sans font-medium">
              {transferStats.activeTask?.videoTitle || 'None active'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Speed: {transferStats.activeTask?.speed || '0 MB/s'}</span>
            <span>ETA: {transferStats.activeTask?.eta || '--'}</span>
          </div>
        </div>
      </div>

      {/* Drive Verified Archives Box */}
      {user && syncedDriveFiles.length > 0 && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 flex items-center space-x-1.5">
              <FolderCheck className="h-4 w-4" />
              <span>Verified in Google Drive ({syncedDriveFiles.length} files detected):</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">Folder: SkillCapped_Archive</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
            {syncedDriveFiles.slice(0, 10).map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileVideo className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-200 truncate font-mono text-[11px]">{f.name}</span>
                </div>
                {f.webViewLink && (
                  <a
                    href={f.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 shrink-0 ml-2"
                  >
                    <span>View in Drive</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Sub-tabs & Search */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeFilter === 'all'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({queue.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeFilter === 'pending'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending ({transferStats.pending})
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeFilter === 'completed'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Completed ({transferStats.completed})
            </button>
            <button
              onClick={() => setActiveFilter('failed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeFilter === 'failed'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Failed ({transferStats.failed})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            {queue.length > 0 && (
              <button
                onClick={handleClear}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800 hover:bg-slate-800 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Role Filter Chips */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-medium shrink-0 mr-1">Role:</span>
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'Mid', label: 'Mid' },
            { id: 'ADC', label: 'ADC' },
            { id: 'Top', label: 'Top' },
            { id: 'Jungle', label: 'Jungle' },
            { id: 'Support', label: 'Support' },
            { id: 'Fundamentals', label: 'Fundamentals' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                selectedRole === r.id
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No tasks match the selected filter.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition"
              >
                <div className="flex items-start space-x-3 truncate">
                  <div className="pt-0.5 shrink-0">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : task.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-rose-400" />
                    ) : task.status === 'downloading' || task.status === 'uploading' ? (
                      <Activity className="h-4 w-4 text-orange-400 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {task.videoTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center space-x-2">
                      <span>{task.courseTitle} &bull; {task.moduleTitle}</span>
                      {task.sizeBytes && task.sizeBytes > 0 && (
                        <span className="text-emerald-400 font-mono font-medium">
                          &bull; {(task.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      )}
                    </div>
                    {task.error && (
                      <div className="text-[10px] text-rose-400 mt-0.5 truncate max-w-md">
                        {task.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                      task.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : task.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : task.status === 'downloading' || task.status === 'uploading'
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {task.status}
                  </span>

                  {task.status === 'failed' && (
                    <button
                      onClick={() => handleRetryTask(task.id)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-orange-400 transition"
                      title="Retry task"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
