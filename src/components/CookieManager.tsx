import React, { useState, useMemo, useRef } from 'react';
import {
  Key,
  ShieldCheck,
  ShieldAlert,
  Upload,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Info,
  FileText,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { parseNetscapeCookies, jsonToNetscapeCookies } from '../utils/cookieValidator';

interface CookieManagerProps {
  cookiesRaw: string;
  setCookiesRaw: (val: string) => void;
  onResetCookies: () => void;
}

export const CookieManager: React.FC<CookieManagerProps> = ({
  cookiesRaw,
  setCookiesRaw,
  onResetCookies,
}) => {
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => {
    return parseNetscapeCookies(cookiesRaw);
  }, [cookiesRaw]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cookiesRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([cookiesRaw], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookies.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text && (text.trim().startsWith('[') || text.trim().startsWith('{'))) {
        const converted = jsonToNetscapeCookies(text);
        if (converted) {
          setCookiesRaw(converted);
          return;
        }
      }
      setCookiesRaw(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              parsed.hasAuthCookies
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Key className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">cookies.txt Authentication</h3>
                {parsed.hasAuthCookies ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                    <ShieldCheck className="h-3 w-3" />
                    Auth Tokens Detected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                    <ShieldAlert className="h-3 w-3" />
                    No Auth Tokens Found
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Netscape HTTP Cookie format passed to <code className="text-amber-300 font-mono">yt-dlp --cookies cookies.txt</code> to bypass CDN token walls.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt"
              className="hidden"
            />
            <button
              id="upload-cookies-btn"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-orange-400" />
              <span>Upload cookies.txt</span>
            </button>

            <button
              id="download-cookies-btn"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save .txt</span>
            </button>

            <button
              id="copy-cookies-btn"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              id="reset-cookies-btn"
              onClick={onResetCookies}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs rounded-lg transition-colors"
              title="Reset to sample cookie payload"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Validation Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">Valid Cookies</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{parsed.validCount}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">Target Domains</span>
            <p className="text-xl font-bold text-white mt-0.5">{parsed.domains.length}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">CloudFront Tokens</span>
            <p className="text-xl font-bold text-amber-400 mt-0.5">
              {parsed.entries.filter((c) => c.name.toLowerCase().includes('cloudfront')).length}
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">Warnings / Expired</span>
            <p className="text-xl font-bold text-slate-300 mt-0.5">{parsed.warnings.length}</p>
          </div>
        </div>

        {/* Warnings list if any */}
        {parsed.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-1">
            {parsed.warnings.map((w, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2 Column Layout: Instructions & Live Cookie Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: How to Export Cookies Guide */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              How to Export Your Cookies
            </h4>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Method 1: Browser Extension (Recommended)</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">10 Seconds</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                <li>Install <strong className="text-slate-200">"Get cookies.txt LOCALLY"</strong> (Chrome / Firefox extension).</li>
                <li>Log in to your active SkillCapped account and start any course video stream.</li>
                <li>Click the extension icon and select <strong className="text-slate-200">"Export"</strong>.</li>
                <li>Upload or paste the generated file here.</li>
              </ol>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Method 2: Inspect CloudFront CDN Tokens</span>
              </div>
              <p className="text-slate-400">
                SkillCapped uses CloudFront CDN signed cookies (<code className="text-amber-300">CloudFront-Key-Pair-Id</code>, <code className="text-amber-300">CloudFront-Policy</code>, <code className="text-amber-300">CloudFront-Signature</code>). These are included automatically when exporting all cookies on the root domain.
              </p>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
              <span>
                Colab executes securely in your own private Google account session. Cookies are never shared with third parties.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Netscape Cookies Raw Editor */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Raw Netscape Cookie Editor
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {cookiesRaw.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length} entries
            </span>
          </div>

          <textarea
            id="cookies-raw-textarea"
            value={cookiesRaw}
            onChange={(e) => {
              const val = e.target.value;
              if (val.trim().startsWith('[') || val.trim().startsWith('{')) {
                const converted = jsonToNetscapeCookies(val);
                if (converted) {
                  setCookiesRaw(converted);
                  return;
                }
              }
              setCookiesRaw(val);
            }}
            rows={14}
            className="w-full mt-3 flex-1 bg-slate-950 font-mono text-xs text-emerald-300/90 border border-slate-800 rounded-xl p-3.5 focus:outline-none focus:border-orange-500/50 leading-relaxed"
            placeholder="# Netscape HTTP Cookie File&#10;.skill-capped.com TRUE / TRUE 1798765432 session_id xxx"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
