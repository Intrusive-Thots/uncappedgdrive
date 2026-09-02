import React, { useState } from 'react';
import {
  FileCode,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  Play,
  Terminal,
  FileText,
  Sparkles,
  Layers,
  HardDrive
} from 'lucide-react';
import { ArchiverConfig, ManifestData } from '../types';
import {
  generateColabNotebook,
  generatePythonScript,
  generateShellScript,
} from '../utils/colabGenerator';

interface NotebookViewerProps {
  config: ArchiverConfig;
  manifest: ManifestData;
  cookiesRaw: string;
  onOpenColab: () => void;
}

export const NotebookViewer: React.FC<NotebookViewerProps> = ({
  config,
  manifest,
  cookiesRaw,
  onOpenColab,
}) => {
  const [copiedCellIndex, setCopiedCellIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const notebook = generateColabNotebook(config, manifest, cookiesRaw);
  const pythonScript = generatePythonScript(config, manifest);
  const shellScript = generateShellScript(config);

  const handleCopyCell = (index: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCellIndex(index);
    setTimeout(() => setCopiedCellIndex(null), 2000);
  };

  const handleCopyFullNotebookJson = () => {
    navigator.clipboard.writeText(JSON.stringify(notebook, null, 2));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadIpynb = () => {
    const blob = new Blob([JSON.stringify(notebook, null, 2)], {
      type: 'application/x-ipynb+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SkillCapped_Direct_Drive_Archiver.ipynb';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPython = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skillcapped_archiver.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadShell = () => {
    const blob = new Blob([shellScript], { type: 'application/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'run_archiver.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Export Options */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <FileCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Google Colab Ready Notebook</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  .ipynb Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Execute cells sequentially in Google Colab to stream videos directly into <code className="text-amber-300 font-mono">{config.driveBasePath}</code>.
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="download-ipynb-main-btn"
              onClick={handleDownloadIpynb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Download .ipynb Notebook</span>
            </button>

            <button
              onClick={onOpenColab}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              <span>Launch Google Colab</span>
              <ExternalLink className="h-3.5 w-3.5 text-orange-400" />
            </button>

            <button
              onClick={handleDownloadPython}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs rounded-xl transition-all"
              title="Download standalone Python script"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>.py Script</span>
            </button>

            <button
              onClick={handleDownloadShell}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs rounded-xl transition-all"
              title="Download Shell bash script"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>.sh Script</span>
            </button>
          </div>
        </div>

        {/* Quick Instructions on Colab Import */}
        <div className="mt-4 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            <span className="font-semibold text-white">How to run in Google Colab:</span>
            <span className="text-slate-400">
              Download <strong className="text-slate-200">.ipynb</strong> → Open Colab → Click <strong className="text-slate-200">"File" &gt; "Upload notebook"</strong> → Run All Cells.
            </span>
          </div>
          <button
            onClick={handleCopyFullNotebookJson}
            className="text-[11px] text-orange-400 hover:text-orange-300 underline underline-offset-2 shrink-0"
          >
            {copiedAll ? '✓ Copied JSON' : 'Copy raw .ipynb JSON'}
          </button>
        </div>
      </div>

      {/* Cells List Preview */}
      <div className="space-y-4">
        {notebook.cells.map((cell, idx) => {
          const rawSource = cell.source.join('');
          const isCode = cell.cell_type === 'code';
          const isCopied = copiedCellIndex === idx;

          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all ${
                isCode
                  ? 'bg-slate-900 border-slate-800 shadow-md'
                  : 'bg-slate-950/40 border-slate-800/60 p-4'
              }`}
            >
              {isCode ? (
                <div>
                  {/* Code Cell Topbar */}
                  <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-orange-400 rounded">
                        [{idx}]
                      </span>
                      <span className="text-xs font-semibold text-slate-300">
                        {idx === 1
                          ? '1. Mount Google Drive'
                          : idx === 3
                          ? '2. Install yt-dlp & aria2c'
                          : idx === 5
                          ? '3. Write Manifest & Cookies'
                          : idx === 7
                          ? '4. Run Video Download Pipeline'
                          : '5. Verify Drive Archive'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyCell(idx, rawSource)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors border border-slate-700"
                        title="Copy this cell's code"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Cell</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Code Body */}
                  <div className="p-4 bg-slate-950/95 overflow-x-auto rounded-b-2xl font-mono text-xs text-amber-200/90 leading-relaxed max-h-96 overflow-y-auto">
                    <pre>{rawSource}</pre>
                  </div>
                </div>
              ) : (
                /* Markdown cell */
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-white">
                    {rawSource.split('\n')[0].replace(/^#+\s*/, '')}
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {rawSource.split('\n').slice(1).join(' ').trim()}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
