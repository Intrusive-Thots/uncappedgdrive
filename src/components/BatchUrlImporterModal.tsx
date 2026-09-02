import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileJson,
  Layers,
  CheckCircle2,
  AlertCircle,
  Film,
  Plus,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { ManifestData } from '../types';
import { parseAndNormalizeManifest } from '../utils/manifestParser';

interface BatchUrlImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newManifest: ManifestData, mode: 'replace' | 'append') => void;
}

export const BatchUrlImporterModal: React.FC<BatchUrlImporterModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [inputText, setInputText] = useState('');
  const [parseResult, setParseResult] = useState<ManifestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setParseResult(null);
      setError(null);
      return;
    }

    try {
      const parsed = parseAndNormalizeManifest(text);
      if (parsed.courses.length === 0) {
        setError('No courses or valid video URLs detected.');
        setParseResult(null);
      } else {
        setParseResult(parsed);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse input.');
      setParseResult(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        handleTextChange(content);
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.courses.length === 0) return;
    onImport(parseResult, importMode);
    onClose();
  };

  const totalVideos = parseResult
    ? parseResult.courses.reduce(
        (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.videos.length, 0),
        0
      )
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Courses or JSON Dump</h3>
              <p className="text-xs text-slate-400">
                Paste JSON dump, course URLs, or upload a .json / .txt file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-orange-500/50 rounded-2xl p-4 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.txt"
              className="hidden"
            />
            <div className="flex items-center justify-center space-x-2 text-slate-400 group-hover:text-orange-400">
              <Upload className="h-4 w-4" />
              <span className="text-xs font-semibold">
                Click to browse or drag & drop SkillCapped JSON file
              </span>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Paste JSON Dump or List of URLs:</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {inputText.length > 0 ? `${inputText.length} chars` : 'Accepts JSON or line URLs'}
              </span>
            </label>
            <textarea
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`Paste any SkillCapped dump or URL list:\n\n{\n  "courses": [\n    {\n      "course_id": "9199rq2gcs",\n      "course_title": "Assassins: The Easy Ways to Hard Carry!",\n      "videos": [...]\n    }\n  ]\n}\n\nOR URLs:\nhttps://www.skill-capped.com/lol/browse/course/t2w4xq8fhc/9199rq2gcs`}
              className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Parse Result Summary */}
          {parseResult && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Successfully Parsed!</span>
                </span>
                <span className="font-mono text-slate-300">
                  {parseResult.courses.length} Courses &bull; {totalVideos} Videos
                </span>
              </div>

              {/* Sample of detected courses */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {parseResult.courses.slice(0, 10).map((c, idx) => {
                  const vidCount = c.modules.reduce((a, m) => a + m.videos.length, 0);
                  return (
                    <div
                      key={c.id || idx}
                      className="flex items-center justify-between text-[11px] bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800"
                    >
                      <span className="text-slate-200 truncate font-medium max-w-[340px]">
                        {c.title}
                      </span>
                      <span className="text-slate-400 font-mono shrink-0 ml-2">
                        {vidCount} vids &bull; {c.game || 'LoL'}
                      </span>
                    </div>
                  );
                })}
                {parseResult.courses.length > 10 && (
                  <p className="text-[11px] text-center text-slate-500 italic pt-1">
                    + {parseResult.courses.length - 10} more courses...
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Import Mode */}
          {parseResult && (
            <div className="flex items-center space-x-4 pt-1">
              <span className="text-xs text-slate-400 font-medium">Import Mode:</span>
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="accent-orange-500"
                />
                <span>Replace Current Manifest</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="accent-orange-500"
                />
                <span>Append to Existing</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!parseResult || parseResult.courses.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 transition shadow-lg"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Load {parseResult?.courses.length || 0} Courses ({totalVideos} Videos)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
