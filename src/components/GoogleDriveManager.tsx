import React, { useState, useEffect } from 'react';
import {
  FolderCheck,
  ExternalLink,
  RefreshCw,
  FolderPlus,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileVideo,
  Folder,
  LogOut,
  FolderTree,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  initAuth,
  getAccessToken,
} from '../services/googleAuth';
import {
  listDriveFiles,
  getOrCreateFolder,
  uploadFileToDrive,
  provisionDriveCourseHierarchy,
  DriveFileItem,
} from '../services/driveService';
import { ArchiverConfig, ManifestData } from '../types';

interface GoogleDriveManagerProps {
  config: ArchiverConfig;
  manifest: ManifestData;
  onOpenColab: () => void;
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  config,
  manifest,
  onOpenColab,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [rootFolder, setRootFolder] = useState<DriveFileItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Extract root folder name from config path, e.g. /content/drive/MyDrive/SkillCapped_Archive -> SkillCapped_Archive
  const configuredRootName =
    config.driveBasePath.split('/').filter(Boolean).pop() || 'SkillCapped_Archive';

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        fetchDriveContents(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMessage({
          type: 'success',
          text: `Connected to Google Drive as ${res.user.email}`,
        });
        await fetchDriveContents(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to sign in with Google Drive permissions.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setRootFolder(null);
    setStatusMessage({
      type: 'info',
      text: 'Disconnected from Google Drive.',
    });
  };

  const fetchDriveContents = async (token?: string) => {
    const activeToken = token || accessToken;
    if (!activeToken) return;

    setLoadingDrive(true);
    try {
      // 1. Locate or retrieve root folder
      const root = await getOrCreateFolder(activeToken, configuredRootName);
      setRootFolder(root);

      // 2. List subfolders and contents
      const files = await listDriveFiles(activeToken, root.id);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error fetching drive contents:', err);
      setStatusMessage({
        type: 'error',
        text: `Error accessing Drive folder: ${err.message}`,
      });
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleProvisionHierarchy = async () => {
    if (!accessToken) return;
    setProvisioning(true);
    setStatusMessage(null);

    try {
      const courseTitles = manifest.courses.map((c) => c.title);
      const res = await provisionDriveCourseHierarchy(
        accessToken,
        configuredRootName,
        courseTitles
      );
      setRootFolder(res.rootFolder);

      // Upload current manifest json as initial backup
      await uploadFileToDrive(
        accessToken,
        config.manifestFileName,
        JSON.stringify(manifest, null, 2),
        'application/json',
        res.rootFolder.id
      );

      setStatusMessage({
        type: 'success',
        text: `Successfully provisioned root folder "${configuredRootName}" with ${courseTitles.length} course subdirectories and manifest backup in your Drive!`,
      });

      await fetchDriveContents(accessToken);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to provision Drive folders: ${err.message}`,
      });
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div id="google-drive-manager" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/40 border border-blue-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-slate-950 uppercase tracking-wide">
                Google Drive Integration
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live Google Drive Cloud Destination
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Connect your Google Drive account with permission from the app's users to automatically organize, 
              provision course folders, save manifests, and monitor downloaded video archives directly in your personal storage.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {user ? (
              <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/40">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white leading-tight">
                      {user.displayName || 'Google Account'}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out of Google Drive"
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors ml-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="sign-in-google-btn"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="gsi-material-button inline-flex items-center space-x-2.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-medium text-xs shadow-md transition-all active:scale-95 disabled:opacity-75"
              >
                <div className="gsi-material-button-icon w-4 h-4">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span className="font-semibold">{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`px-4 py-3 rounded-xl text-xs flex items-center space-x-2.5 shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
              : 'bg-blue-950/60 border border-blue-500/40 text-blue-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Drive Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Setup & Provisioning */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FolderTree className="h-4 w-4 text-blue-400" />
              <span>Google Drive Folder Architecture</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-200">Colab Mount Path:</span>
                  <span className="text-[11px] text-blue-400 font-mono">
                    /content/drive/MyDrive/
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-200">Archive Root Folder:</span>
                  <code className="text-amber-400 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {configuredRootName}
                  </code>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-200">Target Courses:</span>
                  <span className="text-white font-medium">
                    {manifest.courses.length} Course Folders ready
                  </span>
                </div>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                Clicking <strong className="text-slate-200">Provision Course Folders</strong> will use your authorized Google Drive access to 
                automatically create the folder tree and save your active manifest into Drive, preparing it for the Colab ripper.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  id="provision-drive-hierarchy-btn"
                  onClick={handleProvisionHierarchy}
                  disabled={!user || provisioning}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>
                    {provisioning
                      ? 'Creating Folders in Drive...'
                      : `Provision "${configuredRootName}" in Drive`}
                  </span>
                </button>

                <button
                  onClick={() => fetchDriveContents()}
                  disabled={!user || loadingDrive}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingDrive ? 'animate-spin' : ''}`} />
                  <span>Refresh Drive</span>
                </button>
              </div>

              {!user && (
                <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200 flex items-start space-x-2 mt-2">
                  <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Please sign in with Google above to allow the app to create and manage the archive folders in your personal Google Drive with your permission.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Colab Sync Step */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>How Colab Saves Directly to Drive</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p>Google Colab mounts your Drive via <code className="text-amber-300 font-mono text-[11px]">drive.mount('/content/drive')</code>.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p>yt-dlp rips and remuxes videos directly into the <code className="text-blue-300 font-mono text-[11px]">MyDrive/{configuredRootName}</code> folder.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p>The files sync instantly and stay in your permanent Google Drive storage forever.</p>
              </div>
            </div>

            <button
              onClick={onOpenColab}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <span>Launch Google Colab Script</span>
              <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Right Col: Live Drive File Explorer */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-blue-400" />
                <span>Drive Folder Contents</span>
              </h3>
              {rootFolder?.webViewLink && (
                <a
                  href={rootFolder.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center space-x-1"
                >
                  <span>Open in Google Drive</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {loadingDrive ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                <p className="text-xs">Querying Google Drive files...</p>
              </div>
            ) : !user ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center p-6 border border-dashed border-slate-800 rounded-xl space-y-3">
                <Folder className="h-10 w-10 text-slate-600" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-300">Sign in to view Drive contents</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Authorize Google Drive to see created course folders, uploaded manifests, and archived videos.
                  </p>
                </div>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center p-6 border border-dashed border-slate-800 rounded-xl space-y-3">
                <FolderPlus className="h-10 w-10 text-slate-600" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-300">No items found in "{configuredRootName}"</p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Click "Provision in Drive" to create course folders and upload the manifest.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1">
                {driveFiles.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  const isVideo = file.mimeType.includes('video') || file.name.endsWith('.mp4');

                  return (
                    <div
                      key={file.id}
                      className="bg-slate-950 hover:bg-slate-850 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between transition-colors text-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {isFolder ? (
                          <Folder className="h-4 w-4 text-blue-400 shrink-0" />
                        ) : isVideo ? (
                          <FileVideo className="h-4 w-4 text-amber-400 shrink-0" />
                        ) : (
                          <UploadCloud className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="font-medium text-slate-200 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {isFolder ? 'Folder' : file.size ? `${(parseInt(file.size) / (1024 * 1024)).toFixed(1)} MB` : 'File'}
                          </p>
                        </div>
                      </div>

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors ml-2 shrink-0"
                          title="View in Google Drive"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
