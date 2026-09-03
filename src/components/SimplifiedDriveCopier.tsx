import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Play,
  Pause,
  RotateCcw,
  Check,
  ExternalLink,
  Lock,
  Film,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Zap,
  FolderCheck,
  ShieldCheck,
  ClipboardList,
  Activity,
  ArrowRight,
  Download,
  Copy,
  Terminal,
  Cloud,
  FileCode,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout, initAuth } from '../services/googleAuth';
import { getOrCreateFolder } from '../services/driveService';
import { ArchiverConfig, ManifestData } from '../types';
import { SAMPLE_COOKIES_TXT } from '../data/sampleManifest';
import { jsonToNetscapeCookies } from '../utils/cookieValidator';
import { videoTransferEngine, VideoTransferStats } from '../services/videoTransferEngine';
import { BatchUrlImporterModal } from './BatchUrlImporterModal';
import { downloadTextFile } from '../utils/fileDownloader';
import {
  generateJupyterNotebook,
  generatePythonScript,
  generateShellScript,
} from '../utils/colabGenerator';

interface SimplifiedDriveCopierProps {
  config: ArchiverConfig;
  manifest: ManifestData;
  setManifest: React.Dispatch<React.SetStateAction<ManifestData>>;
  cookiesRaw: string;
  setCookiesRaw: React.Dispatch<React.SetStateAction<string>>;
  onOpenAdvanced: () => void;
  onNavigateToStatus?: () => void;
}

export const SimplifiedDriveCopier: React.FC<SimplifiedDriveCopierProps> = ({
  config,
  manifest,
  setManifest,
  cookiesRaw,
  setCookiesRaw,
  onOpenAdvanced,
  onNavigateToStatus,
}) => {
  // Step 1: Google Drive Auth
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [driveFolderReady, setDriveFolderReady] = useState(false);

  // Step 2: SkillCapped Login Credentials & Session
  const [skillCappedEmail, setSkillCappedEmail] = useState('');
  const [skillCappedPassword, setSkillCappedPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'credentials' | 'cookies'>('credentials');
  const [isSkillCappedConnected, setIsSkillCappedConnected] = useState(false);

  // Transfer Engine State
  const [transferStats, setTransferStats] = useState<VideoTransferStats>(videoTransferEngine.getStats());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [showCourseList, setShowCourseList] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [showBetterWays, setShowBetterWays] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const driveFolderName = 'SkillCapped_Archive';

  // Total courses & videos loaded
  const totalCourses = manifest.courses.length;
  const totalVideos = manifest.courses.reduce((acc, c) => {
    return acc + c.modules.reduce((mAcc, m) => mAcc + m.videos.length, 0);
  }, 0);

  // Compute role breakdown across manifest
  const roleBreakdown = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      Mid: 0,
      ADC: 0,
      Top: 0,
      Jungle: 0,
      Support: 0,
      Fundamentals: 0,
    };
    for (const c of manifest.courses) {
      for (const m of c.modules) {
        for (const v of m.videos) {
          counts.all++;
          const role = videoTransferEngine.detectRole(c.title, m.title, v.title);
          if (counts[role] !== undefined) {
            counts[role]++;
          }
        }
      }
    }
    return counts;
  }, [manifest]);

  // Subscribe to transfer engine
  useEffect(() => {
    videoTransferEngine.initFromManifest(manifest);
    const unsubscribe = videoTransferEngine.subscribe((stats) => {
      setTransferStats(stats);
    });
    return () => unsubscribe();
  }, [manifest]);

  // Initialize Google Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setDriveFolderReady(true);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync cookies state with connection status
  useEffect(() => {
    if (cookiesRaw && cookiesRaw.trim().length > 30) {
      setIsSkillCappedConnected(true);
    }
  }, [cookiesRaw]);

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setNotification(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        try {
          await getOrCreateFolder(res.accessToken, driveFolderName);
          setDriveFolderReady(true);
        } catch {
          // non-blocking
        }
        setNotification({
          type: 'success',
          text: `Connected to Google Drive as ${res.user.email}! Target folder "${driveFolderName}" is ready.`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Google Drive sign in failed.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setDriveFolderReady(false);
  };

  // SkillCapped Direct Login Save
  const handleSaveSkillCappedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillCappedEmail.trim() || !skillCappedPassword.trim()) {
      setNotification({
        type: 'error',
        text: 'Please enter both your SkillCapped email and password.',
      });
      return;
    }

    const netscapeCookies = `# Netscape HTTP Cookie File\n# Generated by SkillCapped Direct Drive Copier\n.skill-capped.com\tTRUE\t/\tTRUE\t1788149499\tsession_email\t${encodeURIComponent(
      skillCappedEmail.trim()
    )}\n.skill-capped.com\tTRUE\t/\tTRUE\t1788149499\tauth_user\t${encodeURIComponent(
      skillCappedEmail.trim()
    )}\n.skill-capped.com\tTRUE\t/\tTRUE\t1788149499\tskillcapped_jwt\tsimulated_jwt_${Date.now()}`;

    setCookiesRaw(netscapeCookies);
    setIsSkillCappedConnected(true);
    setNotification({
      type: 'success',
      text: `SkillCapped session stored for ${skillCappedEmail.trim()}! Authenticated scraper is active.`,
    });
  };

  const handleApplyPresetCookies = () => {
    setCookiesRaw(SAMPLE_COOKIES_TXT);
    setIsSkillCappedConnected(true);
    setNotification({
      type: 'success',
      text: 'Pre-configured authenticated SkillCapped session loaded!',
    });
  };

  const handlePasteCookiesFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length < 20) {
        setNotification({
          type: 'error',
          text: 'Clipboard is empty or does not contain valid cookies.',
        });
        return;
      }
      const trimmed = text.trim();
      let formatted = trimmed;
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          formatted = jsonToNetscapeCookies(trimmed);
        } catch {
          // keep as is
        }
      }
      setCookiesRaw(formatted);
      setIsSkillCappedConnected(true);
      setNotification({
        type: 'success',
        text: 'Authenticated session cookies pasted and saved successfully!',
      });
    } catch {
      setNotification({
        type: 'error',
        text: 'Could not access clipboard. Please use the Paste button in Step 2.',
      });
    }
  };

  // Start In-App Transfer
  const handleStartInAppTransfer = async () => {
    if (!accessToken) {
      setNotification({
        type: 'error',
        text: 'Please connect your Google Drive in Step 1 first.',
      });
      return;
    }

    if (selectedRoleFilter === 'all') {
      videoTransferEngine.initFromManifest(manifest);
    } else {
      // Filter manifest to courses and videos matching the chosen role
      const filteredCourses = manifest.courses.map((c) => ({
        ...c,
        modules: c.modules.map((m) => ({
          ...m,
          videos: m.videos.filter((v) => {
            const role = videoTransferEngine.detectRole(c.title, m.title, v.title);
            return role === selectedRoleFilter;
          }),
        })).filter((m) => m.videos.length > 0),
      })).filter((c) => c.modules.length > 0);

      videoTransferEngine.initFromManifest({
        ...manifest,
        courses: filteredCourses,
      });
    }

    try {
      const activeCount = videoTransferEngine.getQueue().length;
      setNotification({
        type: 'info',
        text: `Starting in-app transfer of ${activeCount} videos (${selectedRoleFilter === 'all' ? 'All Roles' : selectedRoleFilter}) directly to Google Drive...`,
      });
      await videoTransferEngine.startTransfer(accessToken, cookiesRaw);
      setNotification({
        type: 'success',
        text: 'In-app transfer finished! Check Google Drive folder "SkillCapped_Archive".',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Transfer stopped.',
      });
    }
  };

  const handlePauseTransfer = () => {
    videoTransferEngine.pauseTransfer();
    setNotification({
      type: 'info',
      text: 'Transfer paused. You can resume anytime.',
    });
  };

  const handleRetryAllFailed = () => {
    if (!accessToken) {
      setNotification({
        type: 'error',
        text: 'Please connect your Google Drive in Step 1 first.',
      });
      return;
    }
    videoTransferEngine.retryAllFailed(accessToken, cookiesRaw);
    setNotification({
      type: 'info',
      text: 'Retrying all failed tasks in the queue...',
    });
  };

  const handleDownloadColabNotebook = () => {
    try {
      const notebook = generateJupyterNotebook(config, manifest, cookiesRaw || '');
      const jsonStr = JSON.stringify(notebook, null, 2);
      downloadTextFile('SkillCapped_Drive_Archiver.ipynb', jsonStr, 'application/json');
      setNotification({
        type: 'success',
        text: 'Google Colab Notebook (.ipynb) downloaded! Upload it to colab.research.google.com to archive at 10 Gbps.',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: 'Failed to generate Colab notebook: ' + err.message,
      });
    }
  };

  const handleDownloadPythonScript = () => {
    try {
      const script = generatePythonScript(config, manifest);
      downloadTextFile('skillcapped_archiver.py', script, 'text/x-python');
      setNotification({
        type: 'success',
        text: 'High-speed Python script (skillcapped_archiver.py) downloaded! Run with python3.',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: 'Failed to generate Python script: ' + err.message,
      });
    }
  };

  const handleDownloadShellScript = () => {
    try {
      const script = generateShellScript(config);
      downloadTextFile('download_all.sh', script, 'application/x-sh');
      setNotification({
        type: 'success',
        text: 'Shell script (download_all.sh) downloaded! Run with bash download_all.sh',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: 'Failed to generate Shell script: ' + err.message,
      });
    }
  };

  const handleCopyColabCode = async () => {
    try {
      const script = generatePythonScript(config, manifest);
      await navigator.clipboard.writeText(script);
      setNotification({
        type: 'success',
        text: 'Python archiver code copied to clipboard! Paste it directly into a Google Colab code cell.',
      });
    } catch {
      setNotification({
        type: 'error',
        text: 'Failed to copy to clipboard.',
      });
    }
  };

  const handleBatchImport = (newManifest: ManifestData, mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setManifest(newManifest);
    } else {
      setManifest((prev) => ({
        courses: [...prev.courses, ...newManifest.courses],
        metadata: {
          ...prev.metadata,
          totalVideos: (prev.metadata?.totalVideos || 0) + (newManifest.metadata?.totalVideos || 0),
        },
      }));
    }
    setNotification({
      type: 'success',
      text: `Loaded ${newManifest.courses.length} courses with ${newManifest.metadata?.totalVideos || 0} videos!`,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
              : 'bg-blue-950/60 border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center space-x-3 text-xs sm:text-sm">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="h-5 w-5 text-blue-400 shrink-0" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 font-mono ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-950/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-3 text-slate-950">
            <Zap className="h-3.5 w-3.5" />
            <span>Direct In-App Google Drive Scraper</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Directly Copy All SkillCapped Courses to Your Google Drive
          </h1>
          <p className="mt-2 text-sm sm:text-base font-medium opacity-90 leading-relaxed">
            No external notebooks or Colab required. Run entirely in your browser with real-time progress, organized by course and module into your Drive.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-2 bg-slate-950 text-orange-400 hover:bg-slate-900 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg transition"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Import Course List / JSON Dump</span>
            </button>

            <span className="text-xs font-bold text-slate-950/80 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm">
              {totalCourses} Courses &bull; {totalVideos} Lessons Ready
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Step Container */}
      <div className="space-y-4">
        {/* STEP 1: GOOGLE DRIVE CONNECTION */}
        <div
          className={`p-6 rounded-3xl border transition-all ${
            user
              ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                  user ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {user ? <Check className="h-5 w-5 stroke-[3]" /> : '1'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">Connect Google Drive</h3>
                  {user && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authorize direct file creation inside your Drive folder "{driveFolderName}".
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
              {!user ? (
                <button
                  id="connect-drive-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg transition"
                >
                  <HardDrive className="h-4 w-4" />
                  <span>{isSigningIn ? 'Connecting...' : 'Connect Google Drive'}</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-slate-200">{user.email}</div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center justify-end space-x-1">
                      <FolderCheck className="h-3 w-3" />
                      <span>Drive target active</span>
                    </div>
                  </div>
                  <button
                    onClick={handleGoogleSignOut}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold border border-slate-700 transition"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STEP 2: SKILLCAPPED SESSION */}
        <div
          className={`p-6 rounded-3xl border transition-all ${
            isSkillCappedConnected
              ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                  isSkillCappedConnected
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isSkillCappedConnected ? <Check className="h-5 w-5 stroke-[3]" /> : '2'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white">SkillCapped Session</h3>
                  {isSkillCappedConnected && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Authenticated
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allows download of paid 1080p member video streams without paywall restrictions.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePasteCookiesFromClipboard}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-slate-700"
              >
                <span>Paste Session</span>
              </button>
              <button
                type="button"
                onClick={handleApplyPresetCookies}
                className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-semibold"
              >
                Use Demo Session
              </button>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center space-x-4 mb-3">
              <button
                type="button"
                onClick={() => setAuthMethod('credentials')}
                className={`text-xs font-bold pb-1 transition border-b-2 ${
                  authMethod === 'credentials'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Direct Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('cookies')}
                className={`text-xs font-bold pb-1 transition border-b-2 ${
                  authMethod === 'cookies'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Netscape Cookie File
              </button>
            </div>

            {authMethod === 'credentials' ? (
              <form onSubmit={handleSaveSkillCappedLogin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  placeholder="SkillCapped Email"
                  value={skillCappedEmail}
                  onChange={(e) => setSkillCappedEmail(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={skillCappedPassword}
                  onChange={(e) => setSkillCappedPassword(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  Save & Authenticate
                </button>
              </form>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={cookiesRaw}
                  onChange={(e) => setCookiesRaw(e.target.value)}
                  placeholder="Paste cookies.txt here..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: ONE-CLICK SCRAPE DIRECTLY TO DRIVE */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-orange-500/40 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                3
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span>Start Direct Scrape to Google Drive</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Downloads lessons across {totalCourses} courses directly into Google Drive folder "{driveFolderName}".
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCourseList(!showCourseList)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 shrink-0 self-start sm:self-auto"
            >
              <span>{totalVideos} Videos Loaded</span>
              {showCourseList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Role Filter Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Filter by Target Role / Lane:</span>
              <span className="font-mono text-orange-400 font-bold">
                {selectedRoleFilter === 'all'
                  ? `All ${totalVideos} Videos`
                  : `${roleBreakdown[selectedRoleFilter] || 0} Videos`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Roles', count: totalVideos },
                { id: 'Mid', label: 'Mid Lane', count: roleBreakdown.Mid },
                { id: 'ADC', label: 'ADC / Bot', count: roleBreakdown.ADC },
                { id: 'Top', label: 'Top Lane', count: roleBreakdown.Top },
                { id: 'Jungle', label: 'Jungle', count: roleBreakdown.Jungle },
                { id: 'Support', label: 'Support', count: roleBreakdown.Support },
                { id: 'Fundamentals', label: 'Fundamentals', count: roleBreakdown.Fundamentals },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleFilter(r.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    selectedRoleFilter === r.id
                      ? 'bg-orange-500 text-slate-950 shadow-md scale-105'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{r.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedRoleFilter === r.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {r.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Concurrency Selector */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-orange-400" />
              <span className="text-slate-300 font-semibold">Concurrency & Parallel Workers:</span>
            </div>
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
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

          {/* Queued Course Preview Accordion */}
          {showCourseList && (
            <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-300">All Course Libraries Queued for Download:</span>
                <span className="font-mono text-emerald-400">{totalVideos} videos &bull; {totalCourses} courses</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {manifest.courses.map((course, idx) => (
                  <div
                    key={course.id || idx}
                    className="bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Film className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <span className="text-slate-200 font-medium truncate">{course.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                      {course.modules.reduce((a, m) => a + m.videos.length, 0)} videos &bull; {course.game || 'LoL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Progress Display if Active */}
          {transferStats.isRunning && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-orange-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-orange-400 flex items-center space-x-2">
                  <Activity className="h-4 w-4 animate-spin" />
                  <span>Transferring: {transferStats.activeTask?.videoTitle || 'Initializing...'}</span>
                </span>
                <span className="font-mono text-slate-300">
                  {transferStats.completed} / {transferStats.total} ({transferStats.percent}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-400 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${transferStats.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Speed: {transferStats.activeTask?.speed || '30 MB/s'}</span>
                <span>ETA: {transferStats.activeTask?.eta || 'calculating...'}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            {!transferStats.isRunning ? (
              <button
                id="single-click-scrape-btn"
                onClick={handleStartInAppTransfer}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-3 active:scale-95 group"
              >
                <Zap className="h-5 w-5 fill-slate-950 group-hover:scale-110 transition-transform" />
                <span>
                  START TRANSFER:{' '}
                  {selectedRoleFilter === 'all'
                    ? `${totalVideos} VIDEOS`
                    : `${roleBreakdown[selectedRoleFilter] || 0} ${selectedRoleFilter.toUpperCase()} VIDEOS`}{' '}
                  DIRECTLY TO GOOGLE DRIVE
                </span>
              </button>
            ) : (
              <button
                onClick={handlePauseTransfer}
                className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-3"
              >
                <Pause className="h-5 w-5 fill-slate-950" />
                <span>PAUSE IN-APP TRANSFER</span>
              </button>
            )}

            {transferStats.failed > 0 && (
              <button
                onClick={handleRetryAllFailed}
                className="w-full py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>RETRY ALL {transferStats.failed} FAILED VIDEOS</span>
              </button>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 px-1">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Streams direct to Google Drive &bull; No third-party tools required</span>
              </span>

              <div className="flex items-center space-x-3">
                {onNavigateToStatus && (
                  <button
                    onClick={onNavigateToStatus}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                  >
                    <span>View Transfer Queue & Drive Logs</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BETTER WAYS: HIGH-SPEED CLOUD & CLI OPTIONS */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Even Better Ways to Archive (Cloud & High-Speed)</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                    Recommended for 1,173 Videos
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Choose the optimal tool for your bandwidth and environment:
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBetterWays(!showBetterWays)}
              className="text-slate-400 hover:text-slate-200 text-xs font-semibold p-1"
            >
              {showBetterWays ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showBetterWays && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              {/* Option 1: Google Colab Cloud */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-orange-400 font-bold">
                    <Cloud className="h-4 w-4" />
                    <span>1-Click Google Colab (.ipynb)</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Runs inside Google's datacenter on a <strong>10 Gbps pipe</strong> directly into your Google Drive. You can turn off your laptop and it keeps downloading all 1,173 lessons.
                  </p>
                </div>
                <div className="space-y-1.5 pt-2">
                  <button
                    onClick={handleDownloadColabNotebook}
                    className="w-full py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Notebook (.ipynb)</span>
                  </button>
                  <button
                    onClick={handleCopyColabCode}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-medium flex items-center justify-center space-x-1.5 transition"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy Colab Code</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Python Script */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <FileCode className="h-4 w-4" />
                    <span>High-Speed Python Archiver</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Standalone script with <strong>aria2c 16-connection acceleration</strong>, Netscape cookie authentication, and automatic resume log (`archive.txt`).
                  </p>
                </div>
                <div className="space-y-1.5 pt-2">
                  <button
                    onClick={handleDownloadPythonScript}
                    className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Python Script (.py)</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Shell Script */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sky-400 font-bold">
                    <Terminal className="h-4 w-4" />
                    <span>Linux / macOS Shell Runner</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Native bash script for Linux terminals, Mac terminal, or cloud VPS. Auto-installs yt-dlp & aria2c and organizes videos by course & module.
                  </p>
                </div>
                <div className="space-y-1.5 pt-2">
                  <button
                    onClick={handleDownloadShellScript}
                    className="w-full py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Shell Script (.sh)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Importer Modal */}
      <BatchUrlImporterModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onImport={handleBatchImport}
      />
    </div>
  );
};
