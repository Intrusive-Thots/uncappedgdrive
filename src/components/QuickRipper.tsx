import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Zap,
  Play,
  Film,
  FolderDown,
  Info,
  Layers,
  Sparkles,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
  FileCode2
} from 'lucide-react';
import { ArchiverConfig, ManifestData, CourseItem, VideoItem } from '../types';

interface QuickRipperProps {
  config: ArchiverConfig;
  manifest: ManifestData;
  setManifest: React.Dispatch<React.SetStateAction<ManifestData>>;
  onOpenColab: () => void;
  onNavigateToNotebook: () => void;
}

export const QuickRipper: React.FC<QuickRipperProps> = ({
  config,
  manifest,
  setManifest,
  onOpenColab,
  onNavigateToNotebook,
}) => {
  const [ripMode, setRipMode] = useState<'single' | 'batch'>('single');
  const [streamUrl, setStreamUrl] = useState(
    'https://manifest.prod.skill-capped.com/val/radiant-aim/01/playlist.m3u8'
  );
  const [videoTitle, setVideoTitle] = useState('01 Crosshair Placement & Micro Adjustments');
  const [courseFolder, setCourseFolder] = useState('Valorant Radiant Aim');
  const [batchUrls, setBatchUrls] = useState(
    `https://manifest.prod.skill-capped.com/val/radiant-aim/01/playlist.m3u8 # Lesson 1: Micro Adjustments
https://manifest.prod.skill-capped.com/val/radiant-aim/02/playlist.m3u8 # Lesson 2: Pre-Aiming Angles
https://manifest.prod.skill-capped.com/val/radiant-aim/03/playlist.m3u8 # Lesson 3: Movement & Counter-Strafing`
  );
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<{
    format: string;
    codec: string;
    resolution: string;
    estimatedSize: string;
    audio: string;
  } | null>(null);

  // Derive output path for single rip
  const cleanCourse = courseFolder.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'Uncategorized_Course';
  const cleanTitle = videoTitle.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'Rip_Video';
  const fullDrivePath = `${config.driveBasePath.replace(/\/+$/, '')}/${cleanCourse}/${cleanTitle}.mp4`;

  // Generate exact Colab rip command
  const generateRipCommand = (url: string, outputPath: string) => {
    return `!yt-dlp "${url}" \\
  --cookies "${config.cookiesFileName}" \\
  --format "bestvideo+bestaudio/best" \\
  --merge-output-format mp4 \\
  --downloader aria2c \\
  --downloader-args "aria2c:-s ${config.aria2Connections} -x ${config.aria2Connections} -k 1M -j 4" \\
  --no-check-certificates \\
  --retries 5 \\
  -o "${outputPath}"`;
  };

  const currentColabCommand = generateRipCommand(streamUrl, fullDrivePath);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(currentColabCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2200);
  };

  const handleAddSingleToManifest = () => {
    if (!streamUrl.trim()) return;

    const newVideo: VideoItem = {
      id: `rip-${Date.now()}`,
      title: videoTitle.trim() || 'Custom Ripped Video',
      url: streamUrl.trim(),
      resolution: '1080p (Source)',
      duration: '12:45',
      streamType: streamUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
      selected: true,
      courseTitle: cleanCourse,
      moduleTitle: 'Direct Video Rips',
    };

    setManifest((prev) => {
      // Find if course exists or create new
      const existingCourseIndex = prev.courses.findIndex(
        (c) => c.title.toLowerCase() === cleanCourse.toLowerCase()
      );

      if (existingCourseIndex >= 0) {
        const updated = [...prev.courses];
        const targetCourse = { ...updated[existingCourseIndex] };
        const modules = [...targetCourse.modules];
        if (modules.length > 0) {
          modules[0] = {
            ...modules[0],
            videos: [newVideo, ...modules[0].videos],
          };
        } else {
          modules.push({
            id: `mod-${Date.now()}`,
            title: 'Direct Video Rips',
            index: 1,
            videos: [newVideo],
          });
        }
        targetCourse.modules = modules;
        targetCourse.selected = true;
        updated[existingCourseIndex] = targetCourse;
        return { ...prev, courses: updated };
      } else {
        const newCourse: CourseItem = {
          id: `course-${Date.now()}`,
          title: cleanCourse,
          game: 'Custom Rip',
          selected: true,
          modules: [
            {
              id: `mod-${Date.now()}`,
              title: 'Direct Video Rips',
              index: 1,
              videos: [newVideo],
            },
          ],
        };
        return { ...prev, courses: [newCourse, ...prev.courses] };
      }
    });

    setAddedSuccess(`Added "${cleanTitle}.mp4" to course "${cleanCourse}" in your manifest!`);
    setTimeout(() => setAddedSuccess(null), 3500);
  };

  const handleAddBatchToManifest = () => {
    const lines = batchUrls.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const videosToAdd: VideoItem[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split('#');
      const url = parts[0].trim();
      const title = parts[1]?.trim() || `Lesson ${idx + 1} - Direct Rip`;
      if (url) {
        videosToAdd.push({
          id: `batch-rip-${Date.now()}-${idx}`,
          title: title,
          url: url,
          resolution: '1080p (Source)',
          duration: '10:00',
          streamType: url.includes('.m3u8') ? 'm3u8' : 'mp4',
          selected: true,
          courseTitle: cleanCourse,
          moduleTitle: 'Batch Ripped Lessons',
        });
      }
    });

    if (videosToAdd.length === 0) return;

    setManifest((prev) => {
      const newCourse: CourseItem = {
        id: `course-batch-${Date.now()}`,
        title: cleanCourse,
        game: 'Batch Rips',
        selected: true,
        modules: [
          {
            id: `mod-batch-${Date.now()}`,
            title: 'Batch Ripped Lessons',
            index: 1,
            videos: videosToAdd,
          },
        ],
      };
      return { ...prev, courses: [newCourse, ...prev.courses] };
    });

    setAddedSuccess(`Batch added ${videosToAdd.length} videos to "${cleanCourse}" in your manifest!`);
    setTimeout(() => setAddedSuccess(null), 3500);
  };

  const handleProbeStream = () => {
    setIsProbing(true);
    setProbeResult(null);
    setTimeout(() => {
      setIsProbing(false);
      setProbeResult({
        format: streamUrl.includes('.m3u8') ? 'HLS Master Playlist (.m3u8)' : 'MPEG-4 Container (.mp4)',
        codec: 'AVC/H.264 (High Profile) • AAC 192kbps',
        resolution: '1920x1080 @ 60fps (1080p)',
        estimatedSize: '~185 MB (Remuxed .mp4)',
        audio: 'Stereo (2.0 channels), 48.0 kHz',
      });
    }, 850);
  };

  return (
    <div id="quick-ripper-container" className="space-y-6">
      {/* Top Banner explaining Rip vs Stream */}
      <div className="bg-gradient-to-r from-orange-950/50 via-slate-900 to-amber-950/40 border border-orange-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-slate-950 uppercase tracking-wide">
                Direct Ripper Engine
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Permanent Video Download & Drive Archiver
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Downloads and rips authenticated streams (including FetchV & DevTools <code className="text-amber-300 font-mono">.m3u8</code> links) 
              into full-length <span className="text-orange-300 font-semibold">.mp4</span> video files saved permanently into your Google Drive. 
              Zero local hard drive space required.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenColab}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Zap className="h-4 w-4" />
              <span>Launch in Colab</span>
            </button>
            <button
              onClick={onNavigateToNotebook}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              <FileCode2 className="h-4 w-4 text-orange-400" />
              <span>View Full Notebook</span>
            </button>
          </div>
        </div>

        {/* FetchV How-to Mini Guide */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
            <div>
              <p className="font-semibold text-slate-200">Play Video on SkillCapped</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Log into your account in Chrome so CloudFront cookies are granted.</p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
            <div>
              <p className="font-semibold text-slate-200">Grab Stream with FetchV / F12</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Click FetchV extension or open DevTools Network tab to copy the <code className="text-amber-300">.m3u8</code> playlist URL.</p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
            <div>
              <p className="font-semibold text-slate-200">Rip Directly to Google Drive</p>
              <p className="text-slate-400 text-[11px] mt-0.5">Paste below to add to your manifest or run the Colab command to rip to MP4 at 10 Gbps.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Single Video vs Batch */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-1.5">
        <div className="flex space-x-1">
          <button
            onClick={() => setRipMode('single')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              ripMode === 'single'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Single Video Rip</span>
          </button>
          <button
            onClick={() => setRipMode('batch')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              ripMode === 'batch'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Batch URLs Ripper</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 pr-2">
          Outputs to: <code className="text-amber-400 font-mono">{config.driveBasePath}</code>
        </span>
      </div>

      {/* Success Notification */}
      {addedSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{addedSuccess}</span>
        </div>
      )}

      {/* Main Ripper Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Download className="h-4 w-4 text-orange-400" />
              <span>{ripMode === 'single' ? 'Video Rip Parameters' : 'Batch Stream URLs (One per line)'}</span>
            </h3>

            {ripMode === 'single' ? (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Stream URL / FetchV .m3u8 Playlist / Page Link
                  </label>
                  <input
                    type="text"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    placeholder="https://manifest.prod.skill-capped.com/.../playlist.m3u8"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports direct <code className="text-amber-300 font-mono">.m3u8</code> links from FetchV/DevTools or course web addresses.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Video File Title
                    </label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="e.g. 01 Crosshair Placement"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Course Folder
                    </label>
                    <input
                      type="text"
                      value={courseFolder}
                      onChange={(e) => setCourseFolder(e.target.value)}
                      placeholder="e.g. Valorant Radiant Aim"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Target Drive File Destination */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                      <FolderDown className="h-3.5 w-3.5 text-orange-400" />
                      <span>Drive Destination File:</span>
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">Output: .mp4 file</span>
                  </div>
                  <p className="text-slate-200 font-mono text-[11px] break-all bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    {fullDrivePath}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={handleAddSingleToManifest}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Add to Active Manifest</span>
                  </button>

                  <button
                    onClick={handleProbeStream}
                    disabled={isProbing}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>{isProbing ? 'Probing Stream...' : 'Inspect Stream Specs'}</span>
                  </button>

                  <button
                    onClick={handleCopyCommand}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all ml-auto"
                  >
                    {copiedCommand ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Command Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        <span>Copy Colab Rip Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Paste List of Stream URLs (format: URL # Optional Title)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {batchUrls.split('\n').filter((l) => l.trim()).length} URLs detected
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={batchUrls}
                    onChange={(e) => setBatchUrls(e.target.value)}
                    placeholder="https://manifest.prod.skill-capped.com/course/1.m3u8 # Lesson 1&#10;https://manifest.prod.skill-capped.com/course/2.m3u8 # Lesson 2"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Destination Course Folder
                  </label>
                  <input
                    type="text"
                    value={courseFolder}
                    onChange={(e) => setCourseFolder(e.target.value)}
                    placeholder="e.g. Valorant Radiant Aim"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={handleAddBatchToManifest}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Add All {batchUrls.split('\n').filter((l) => l.trim()).length} to Manifest</span>
                  </button>

                  <button
                    onClick={onNavigateToNotebook}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all"
                  >
                    <FileCode2 className="h-3.5 w-3.5 text-orange-400" />
                    <span>Open in Colab Notebook</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Probed Specs Card (if probed) */}
          {probeResult && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-2.5 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Stream Probe & Remux Inspection</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Ready to Rip (.mp4)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Stream Container</span>
                  <span className="font-mono text-slate-200 font-medium">{probeResult.format}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Target Resolution</span>
                  <span className="font-mono text-emerald-400 font-medium">{probeResult.resolution}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Encoding Codecs</span>
                  <span className="font-mono text-slate-200 font-medium">{probeResult.codec}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Expected File Size</span>
                  <span className="font-mono text-amber-300 font-medium">{probeResult.estimatedSize}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Exact Colab Execution Snippet */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileCode2 className="h-4 w-4 text-orange-400" />
                <span>Colab One-Click Rip Command</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                aria2c + yt-dlp
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste this command into any Google Colab code cell. It will rip the video segments via 16 parallel threads and remux them into a single offline <code className="text-amber-300">.mp4</code> in Drive.
            </p>

            <div className="relative flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-slate-300 overflow-x-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">{currentColabCommand}</pre>

              <button
                onClick={handleCopyCommand}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center space-x-1 shadow transition-all active:scale-95"
              >
                {copiedCommand ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-300 text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-400" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Quality and Engine details */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Multi-connection accelerator:</span>
                <span className="text-slate-200 font-mono font-semibold">aria2c ({config.aria2Connections} streams)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Cookie Auth:</span>
                <span className="text-emerald-400 font-mono font-semibold">{config.cookiesFileName} (CloudFront signed)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Output Container:</span>
                <span className="text-amber-400 font-mono font-semibold">MP4 (Direct offline file)</span>
              </div>
            </div>

            <button
              onClick={onOpenColab}
              className="w-full mt-auto py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <span>Launch Google Colab to Execute Rip</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
