import React from 'react';
import { CloudDownload, ExternalLink, HardDrive, Terminal, Sparkles, FileCode2, Zap, Activity } from 'lucide-react';

interface HeaderProps {
  onOpenColab: () => void;
  onDownloadIpynb: () => void;
  totalVideosCount: number;
  totalCoursesCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenColab,
  onDownloadIpynb,
  totalVideosCount,
  totalCoursesCount,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header id="app-header" className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <CloudDownload className="h-5 w-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">Colab Stream Archiver</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full">
                  Direct Drive Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                SkillCapped JSON Manifest & Cookies → Colab <code className="text-amber-300 font-mono">yt-dlp</code> pipeline
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              id="tab-simple"
              onClick={() => setActiveTab('simple')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'simple'
                  ? 'bg-orange-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Drive Video Copier</span>
            </button>

            <button
              id="tab-status"
              onClick={() => setActiveTab('status')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'status'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Status</span>
            </button>

            <button
              id="tab-gdrive"
              onClick={() => setActiveTab('gdrive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'gdrive'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5 text-blue-400" />
              <span>Drive Folders</span>
            </button>

            <button
              id="tab-manifest"
              onClick={() => setActiveTab('manifest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'manifest'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Course Library ({totalCoursesCount})
            </button>

            <button
              id="tab-colab"
              onClick={() => setActiveTab('colab')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'colab'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Colab Notebook
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              id="header-download-ipynb"
              onClick={onDownloadIpynb}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-all shadow-sm active:scale-95"
              title="Download Jupyter Notebook (.ipynb)"
            >
              <FileCode2 className="h-3.5 w-3.5 text-orange-400" />
              <span className="hidden sm:inline">Export .ipynb</span>
            </button>

            <button
              id="header-open-colab"
              onClick={onOpenColab}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-md shadow-orange-500/20 active:scale-95"
            >
              <span>Open Google Colab</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
