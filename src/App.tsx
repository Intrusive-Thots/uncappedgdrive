import React, { useState, useEffect } from 'react';
import { SAMPLE_MANIFEST, SAMPLE_COOKIES_TXT } from './data/sampleManifest';
import { ArchiverConfig, ManifestData } from './types';
import { Header } from './components/Header';
import { ManifestManager } from './components/ManifestManager';
import { CookieManager } from './components/CookieManager';
import { SettingsPanel } from './components/SettingsPanel';
import { QuickRipper } from './components/QuickRipper';
import { GoogleDriveManager } from './components/GoogleDriveManager';
import { SimplifiedDriveCopier } from './components/SimplifiedDriveCopier';
import { StatusTab } from './components/StatusTab';
import { BatchUrlImporterModal } from './components/BatchUrlImporterModal';
import {
  FileJson,
  Key,
  Sliders,
  Terminal,
  Zap,
  HardDrive,
  Activity,
} from 'lucide-react';
import { initAuth } from './services/googleAuth';
import { User } from 'firebase/auth';

export default function App() {
  const [manifest, setManifest] = useState<ManifestData>(SAMPLE_MANIFEST);
  const [cookiesRaw, setCookiesRaw] = useState<string>(SAMPLE_COOKIES_TXT);
  const [activeTab, setActiveTab] = useState<string>('simple');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Global Auth state shared across app
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const [config, setConfig] = useState<ArchiverConfig>({
    driveBasePath: '/content/drive/MyDrive/SkillCapped_Archive/',
    folderStructure:
      '{course_title}/{module_index}_{module_title}/{video_index}_{video_title}',
    downloadEngine: 'aria2c',
    concurrentDownloads: 1,
    aria2Connections: 16,
    videoQuality: 'best',
    enableArchiveLog: true,
    archiveLogFileName: 'archive.txt',
    embedSubtitles: false,
    embedMetadata: true,
    embedThumbnail: false,
    rateLimit: 'none',
    retryAttempts: 5,
    retrySleepSeconds: 3,
    useCustomCookies: true,
    cookiesFileName: 'cookies.txt',
    manifestFileName: 'skillcapped_course_videos_authed.json',
    autoUnmountOnFinish: false,
    notifyOnFinish: true,
  });

  const totalCoursesCount = manifest.courses.length;
  const totalVideosCount = manifest.courses.reduce(
    (acc, c) =>
      c.selected !== false
        ? acc +
          (c.modules || []).reduce(
            (mAcc, m) =>
              mAcc + (m.videos || []).filter((v) => v.selected !== false).length,
            0
          )
        : acc,
    0
  );

  const handleResetManifest = () => {
    setManifest(SAMPLE_MANIFEST);
  };

  const handleResetCookies = () => {
    setCookiesRaw(SAMPLE_COOKIES_TXT);
  };

  const handleResetConfig = () => {
    setConfig({
      driveBasePath: '/content/drive/MyDrive/SkillCapped_Archive/',
      folderStructure:
        '{course_title}/{module_index}_{module_title}/{video_index}_{video_title}',
      downloadEngine: 'aria2c',
      concurrentDownloads: 1,
      aria2Connections: 16,
      videoQuality: 'best',
      enableArchiveLog: true,
      archiveLogFileName: 'archive.txt',
      embedSubtitles: false,
      embedMetadata: true,
      embedThumbnail: false,
      rateLimit: 'none',
      retryAttempts: 5,
      retrySleepSeconds: 3,
      useCustomCookies: true,
      cookiesFileName: 'cookies.txt',
      manifestFileName: 'skillcapped_course_videos_authed.json',
      autoUnmountOnFinish: false,
      notifyOnFinish: true,
    });
  };

  const handleBatchImport = (newManifest: ManifestData, mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setManifest(newManifest);
    } else {
      setManifest((prev) => ({
        courses: [...prev.courses, ...newManifest.courses],
        metadata: {
          ...prev.metadata,
          totalVideos:
            (prev.metadata?.totalVideos || 0) + (newManifest.metadata?.totalVideos || 0),
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* Header */}
      <Header
        totalVideosCount={totalVideosCount}
        totalCoursesCount={totalCoursesCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBatchImport={() => setIsBatchModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab Selection Bar on Mobile / Tablet */}
        <div className="flex md:hidden overflow-x-auto space-x-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('simple')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'simple'
                ? 'bg-orange-500 text-slate-950 font-bold'
                : 'text-slate-400'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Drive Scraper</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Status</span>
          </button>

          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'manifest'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400'
            }`}
          >
            <FileJson className="h-3.5 w-3.5 text-orange-400" />
            <span>Courses ({totalCoursesCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('gdrive')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'gdrive'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5 text-blue-400" />
            <span>Drive Files</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cookies'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400'
            }`}
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
            <span>Cookies</span>
          </button>
        </div>

        {/* Dynamic Content */}
        {activeTab === 'simple' && (
          <SimplifiedDriveCopier
            config={config}
            manifest={manifest}
            setManifest={setManifest}
            cookiesRaw={cookiesRaw}
            setCookiesRaw={setCookiesRaw}
            onOpenAdvanced={() => setActiveTab('manifest')}
            onNavigateToStatus={() => setActiveTab('status')}
          />
        )}

        {/* Real-Time Status & Progress Tab */}
        {activeTab === 'status' && (
          <StatusTab
            manifest={manifest}
            user={user}
            accessToken={accessToken}
            onSwitchToCopier={() => setActiveTab('simple')}
          />
        )}

        {/* Course Library Management */}
        {activeTab === 'manifest' && (
          <ManifestManager
            manifest={manifest}
            setManifest={setManifest}
            onResetDefault={handleResetManifest}
          />
        )}

        {/* Cookie Session Management */}
        {activeTab === 'cookies' && (
          <CookieManager
            cookiesRaw={cookiesRaw}
            setCookiesRaw={setCookiesRaw}
            onResetCookies={handleResetCookies}
          />
        )}

        {/* Settings Panel */}
        {activeTab === 'settings' && (
          <SettingsPanel
            config={config}
            setConfig={setConfig}
            onResetDefaults={handleResetConfig}
          />
        )}

        {/* Google Drive File Explorer */}
        {activeTab === 'gdrive' && (
          <GoogleDriveManager
            config={config}
            manifest={manifest}
            onOpenColab={() => setActiveTab('simple')}
          />
        )}

        {/* Direct URL Ripper */}
        {activeTab === 'quick-rip' && (
          <QuickRipper
            config={config}
            manifest={manifest}
            setManifest={setManifest}
            onOpenColab={() => setActiveTab('simple')}
            onNavigateToNotebook={() => setActiveTab('status')}
          />
        )}
      </main>

      {/* Global Batch Import Modal */}
      <BatchUrlImporterModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onImport={handleBatchImport}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            SkillCapped Direct Drive Copier • In-browser stream scraping & direct Google Drive archiver
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              + Batch Import URLs / JSON Dump
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
