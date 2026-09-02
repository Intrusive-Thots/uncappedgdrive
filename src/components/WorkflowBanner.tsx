import React from 'react';
import { HardDrive, UploadCloud, Terminal, Zap, CheckCircle2, Copy } from 'lucide-react';

interface WorkflowBannerProps {
  drivePath: string;
  onCopyMountSnippet: () => void;
  copied: boolean;
}

export const WorkflowBanner: React.FC<WorkflowBannerProps> = ({
  drivePath,
  onCopyMountSnippet,
  copied,
}) => {
  return (
    <div id="workflow-overview-card" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Cloud Archival Pipeline Workflow
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero disk footprint on your machine. Google Colab streams videos directly to your Drive over Google Cloud 10Gbps backbone.
          </p>
        </div>

        {/* Quick Drive Mount Snippet */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
          <HardDrive className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-emerald-400">from google.colab import drive; drive.mount('/content/drive')</span>
          <button
            id="copy-mount-snippet-btn"
            onClick={onCopyMountSnippet}
            className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors"
            title="Copy Drive mount code"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Interactive Flow Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <HardDrive className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wide">Step 1</span>
            <p className="text-xs font-semibold text-slate-200">Mount Google Drive</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate" title={drivePath}>
              {drivePath}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <UploadCloud className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wide">Step 2</span>
            <p className="text-xs font-semibold text-slate-200">Load JSON & Cookies</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <code className="text-slate-300 font-mono">skillcapped...authed.json</code> + <code className="text-slate-300 font-mono">cookies.txt</code>
            </p>
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wide">Step 3</span>
            <p className="text-xs font-semibold text-slate-200">yt-dlp + aria2c</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multi-threaded stream capture with resume lock
            </p>
          </div>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Step 4</span>
            <p className="text-xs font-semibold text-slate-200">Direct Cloud Ingestion</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Direct Drive writes at Google data-center speed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
