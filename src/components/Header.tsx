import React from 'react';
import {
  CloudDownload,
  HardDrive,
  Sparkles,
  Zap,
  Activity,
  FileJson,
  Key,
  Sliders,
} from 'lucide-react';

interface HeaderProps {
  totalVideosCount: number;
  totalCoursesCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBatchImport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalVideosCount,
  totalCoursesCount,
  activeTab,
  setActiveTab,
  onOpenBatchImport,
}) => {
  return (
    <header id="app-header" className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('simple')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <CloudDownload className="h-5 w-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">SkillCapped Drive Copier</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Direct In-App
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                SkillCapped Authenticated Manifest → Google Drive Direct Archiver
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
              <span>Drive Scraper</span>
            </button>

            <button
              id="tab-status"
              onClick={() => setActiveTab('status')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'status'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Status Queue</span>
            </button>

            <button
              id="tab-manifest"
              onClick={() => setActiveTab('manifest')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'manifest'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileJson className="h-3.5 w-3.5" />
              <span>Courses ({totalCoursesCount})</span>
            </button>

            <button
              id="tab-gdrive"
              onClick={() => setActiveTab('gdrive')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'gdrive'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5 text-blue-400" />
              <span>Drive Files</span>
            </button>

            <button
              id="tab-cookies"
              onClick={() => setActiveTab('cookies')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'cookies'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              <span>Cookies</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {onOpenBatchImport && (
              <button
                onClick={onOpenBatchImport}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                <span>+ Import JSON/URLs</span>
              </button>
            )}

            <button
              id="header-settings-btn"
              onClick={() => setActiveTab('settings')}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Archiver Settings"
            >
              <Sliders className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
