import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  HardDrive,
  Zap,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import { ArchiverConfig, ManifestData } from '../types';

interface DryRunSimulatorProps {
  config: ArchiverConfig;
  manifest: ManifestData;
  onOpenColab: () => void;
}

interface LogLine {
  id: string;
  type: 'info' | 'success' | 'warn' | 'stream' | 'progress';
  text: string;
  timestamp: string;
}

export const DryRunSimulator: React.FC<DryRunSimulatorProps> = ({
  config,
  manifest,
  onOpenColab,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentVideoName, setCurrentVideoName] = useState('');
  const [downloadSpeed, setDownloadSpeed] = useState('0 MB/s');
  const [isCompleted, setIsCompleted] = useState(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Flatten selected videos
  const selectedVideosList = manifest.courses.flatMap((c) =>
    c.selected !== false
      ? c.modules.flatMap((m) =>
          m.videos
            .filter((v) => v.selected !== false)
            .map((v) => ({
              ...v,
              courseTitle: c.title,
              moduleIndex: m.index,
              moduleTitle: m.title,
            }))
        )
      : []
  );

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, type: LogLine['type'] = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev,
      { id: Math.random().toString(), type, text, timestamp: time },
    ]);
  };

  const startSimulation = () => {
    setIsRunning(true);
    setIsCompleted(false);
    setLogs([]);
    setCurrentProgress(0);

    const steps: Array<() => Promise<void>> = [
      async () => {
        addLog('Colab Runtime: Connecting to Google Cloud VM (us-central1-a)...', 'info');
        await new Promise((r) => setTimeout(r, 600));
        addLog('⚡ 2x vCPU @ 2.20GHz | 12.7 GB RAM | 10 Gbps Cloud Network attached', 'success');
      },
      async () => {
        addLog("Mounting Google Drive: drive.mount('/content/drive')...", 'info');
        await new Promise((r) => setTimeout(r, 800));
        addLog(`✅ Mounted at /content/drive. Ready to write to: ${config.driveBasePath}`, 'success');
      },
      async () => {
        addLog(`Checking files: ${config.manifestFileName} (Found) | ${config.cookiesFileName} (Validated Netscape format)`, 'info');
        addLog(`Engine: ${config.downloadEngine.toUpperCase()} with ${config.aria2Connections} parallel segment threads`, 'info');
        await new Promise((r) => setTimeout(r, 600));
      },
      ...selectedVideosList.map((video, idx) => async () => {
        setCurrentVideoName(video.title);
        const videoNum = idx + 1;
        const total = selectedVideosList.length;

        addLog(
          `▶️ [${videoNum}/${total}] Downloading: ${video.courseTitle} > ${video.moduleIndex}_${video.moduleTitle} > ${video.title}`,
          'stream'
        );

        // Progress pulses
        for (let p = 20; p <= 100; p += 20) {
          await new Promise((r) => setTimeout(r, 220));
          const speed = (90 + Math.random() * 40).toFixed(1);
          setDownloadSpeed(`${speed} MB/s`);
          setCurrentProgress(Math.round(((idx + p / 100) / total) * 100));
        }

        const outPath = `${config.driveBasePath}${video.courseTitle}/${video.moduleIndex}_${video.moduleTitle}/${video.title}.mp4`;
        addLog(`   ✅ Stream captured & written directly to Drive: ${outPath}`, 'success');
      }),
      async () => {
        addLog('====================================================', 'info');
        addLog(`🎉 All ${selectedVideosList.length} course video streams archived successfully!`, 'success');
        addLog(`📁 Google Drive Folder: ${config.driveBasePath}`, 'success');
        addLog(`📝 Resume log synced to: ${config.archiveLogFileName}`, 'info');
        setIsCompleted(true);
        setIsRunning(false);
        setDownloadSpeed('0 MB/s');
      },
    ];

    // Execute steps sequentially
    let cancel = false;
    (async () => {
      for (const step of steps) {
        if (cancel) break;
        await step();
      }
    })();
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setLogs([]);
    setCurrentProgress(0);
    setCurrentVideoName('');
    setDownloadSpeed('0 MB/s');
  };

  return (
    <div className="space-y-4">
      {/* Simulator Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Google Colab Execution Simulator</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                  Cloud Speed Emulation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dry-run the exact Colab streaming execution before downloading the notebook.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                id="start-simulator-btn"
                onClick={startSimulation}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Simulate Run</span>
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl"
              >
                <Pause className="h-3.5 w-3.5" />
                <span>Stop</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
              title="Reset terminal logs"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400">Throughput</span>
            <p className="text-lg font-bold font-mono text-cyan-400 mt-0.5">{downloadSpeed}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400">Progress</span>
            <p className="text-lg font-bold font-mono text-white mt-0.5">{currentProgress}%</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400">Total Queued</span>
            <p className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {selectedVideosList.length} streams
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400">Drive Location</span>
            <p className="text-xs font-bold font-mono text-slate-300 mt-1 truncate" title={config.driveBasePath}>
              /MyDrive/SkillCapped_Archive/
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="truncate pr-2 font-medium text-slate-300">
                Streaming: <span className="text-cyan-400 font-mono">{currentVideoName}</span>
              </span>
              <span className="font-mono text-cyan-400">{currentProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Terminal View */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-[11px] text-slate-400">
              Google Colab Kernel Console [bash / python3]
            </span>
          </div>

          <span className="text-[11px] text-emerald-400 font-mono">
            {isRunning ? '● RUNNING' : isCompleted ? '● FINISHED' : '○ IDLE'}
          </span>
        </div>

        <div className="h-80 overflow-y-auto space-y-1.5 text-slate-300 leading-relaxed pr-2">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
              <Terminal className="h-8 w-8 mb-2 opacity-50 text-cyan-400" />
              <span>Click "Simulate Run" above to preview the Colab direct-to-Drive pipeline.</span>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2">
                <span className="text-slate-600 text-[10px] shrink-0">{log.timestamp}</span>
                <span
                  className={`break-all ${
                    log.type === 'success'
                      ? 'text-emerald-400'
                      : log.type === 'warn'
                      ? 'text-amber-400'
                      : log.type === 'stream'
                      ? 'text-cyan-300 font-semibold'
                      : 'text-slate-300'
                  }`}
                >
                  {log.text}
                </span>
              </div>
            ))
          )}
          <div ref={terminalBottomRef} />
        </div>
      </div>
    </div>
  );
};
