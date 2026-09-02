import React from 'react';
import {
  Settings,
  HardDrive,
  Zap,
  Gauge,
  Film,
  FolderTree,
  FileCheck,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { ArchiverConfig } from '../types';

interface SettingsPanelProps {
  config: ArchiverConfig;
  setConfig: React.Dispatch<React.SetStateAction<ArchiverConfig>>;
  onResetDefaults: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  setConfig,
  onResetDefaults,
}) => {
  const updateConfig = <K extends keyof ArchiverConfig>(
    key: K,
    val: ArchiverConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Drive & yt-dlp Engine Tuning</h3>
              <p className="text-xs text-slate-400">
                Configure destination path, aria2c high-throughput concurrency, quality presets, and resume logs.
              </p>
            </div>
          </div>

          <button
            onClick={onResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          {/* Drive Target Folder */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-amber-400" />
              Target Google Drive Directory
            </label>
            <div className="relative">
              <input
                type="text"
                value={config.driveBasePath}
                onChange={(e) => updateConfig('driveBasePath', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 font-mono text-xs text-amber-300 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500/50"
                placeholder="/content/drive/MyDrive/SkillCapped_Archive/"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Mounted path inside Google Colab. Folder is created automatically if it doesn't already exist.
            </p>
          </div>

          {/* Download Acceleration Engine */}
          <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-orange-400" />
              Download Acceleration Engine
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => updateConfig('downloadEngine', 'aria2c')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  config.downloadEngine === 'aria2c'
                    ? 'bg-orange-500/20 border-orange-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs">aria2c Turbo (Recommended)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  16 parallel stream connections per video segment
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateConfig('downloadEngine', 'standard')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  config.downloadEngine === 'standard'
                    ? 'bg-orange-500/20 border-orange-500/50 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs">Standard yt-dlp Native</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Sequential HLS m3u8 chunk retrieval
                </div>
              </button>
            </div>

            {config.downloadEngine === 'aria2c' && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Connections Per Stream:</span>
                  <span className="font-mono font-bold text-orange-400">{config.aria2Connections}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="2"
                  value={config.aria2Connections}
                  onChange={(e) => updateConfig('aria2Connections', parseInt(e.target.value, 10))}
                  className="w-full accent-orange-500 mt-1 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Video Quality Preset */}
          <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Film className="h-4 w-4 text-blue-400" />
              Stream Quality Preset
            </label>
            <select
              value={config.videoQuality}
              onChange={(e) => updateConfig('videoQuality', e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500/50"
            >
              <option value="best">Highest Available (1080p60 Best Video + Audio)</option>
              <option value="1080p">Cap at 1080p Full HD</option>
              <option value="720p">Cap at 720p HD (Faster transfer)</option>
              <option value="audio_only">Audio Only (.mp3 / podcast mode)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              `yt-dlp` automatically extracts highest-bitrate video and AAC audio tracks and merges them into .mp4.
            </p>
          </div>

          {/* Resume & Archive Log */}
          <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                Resume & Skip Completed Videos
              </label>
              <input
                type="checkbox"
                checked={config.enableArchiveLog}
                onChange={(e) => updateConfig('enableArchiveLog', e.target.checked)}
                className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-0 accent-orange-500 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Uses <code className="text-amber-300 font-mono">--download-archive {config.archiveLogFileName}</code> on Drive so if Colab disconnects, you can rerun and instantly skip finished files.
            </p>
          </div>

          {/* Rate Limit & Throttling */}
          <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-purple-400" />
              Download Rate Limit
            </label>
            <select
              value={config.rateLimit}
              onChange={(e) => updateConfig('rateLimit', e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500/50"
            >
              <option value="none">Unlimited (Full 10Gbps Google Datacenter Speed)</option>
              <option value="50M">50 MB/s (Gentle on CDN)</option>
              <option value="20M">20 MB/s</option>
              <option value="10M">10 MB/s</option>
            </select>
          </div>
        </div>

        {/* Metadata & Subtitles Checkboxes */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.embedMetadata}
              onChange={(e) => updateConfig('embedMetadata', e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 accent-orange-500"
            />
            <span>Embed MP4 Metadata (Chapter tags, Titles)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.embedThumbnail}
              onChange={(e) => updateConfig('embedThumbnail', e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 accent-orange-500"
            />
            <span>Embed Video Cover Thumbnail</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.embedSubtitles}
              onChange={(e) => updateConfig('embedSubtitles', e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 accent-orange-500"
            />
            <span>Embed Subtitles & Closed Captions</span>
          </label>
        </div>

        {/* Folder Structure Preview */}
        <div className="mt-5 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <FolderTree className="h-4 w-4 text-amber-400" />
            <span>Drive Folder Hierarchy Preview:</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 mt-2 space-y-1 pl-2">
            <div>📂 {config.driveBasePath}</div>
            <div className="pl-4">├── 📂 Radiant Mechanics & Aim Mastery 2026/</div>
            <div className="pl-8">├── 📂 01_Crosshair Placement & Micro-Adjustments/</div>
            <div className="pl-12 text-emerald-400">├── 🎬 01_The Golden Angle Rule on Ascent & Haven.mp4</div>
            <div className="pl-12 text-emerald-400">└── 🎬 02_Micro-flicks vs Lazy Pre-aiming Drills.mp4</div>
            <div className="pl-8">└── 📂 02_Advanced Peeking Techniques & Duel Theory/</div>
            <div className="pl-12 text-emerald-400">└── 🎬 01_Ferrari Peeking, Jump-Peeks, & Jiggle Slicing.mp4</div>
            <div className="pl-4 text-amber-300">└── 📄 {config.archiveLogFileName} (Resume tracker)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
