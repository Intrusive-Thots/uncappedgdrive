import React, { useState, useRef } from 'react';
import {
  FileJson,
  Upload,
  Download,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Video,
  Layers,
  Clock,
  ExternalLink,
  RefreshCw,
  Eye,
  Code,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { CourseItem, ManifestData } from '../types';

interface ManifestManagerProps {
  manifest: ManifestData;
  setManifest: React.Dispatch<React.SetStateAction<ManifestData>>;
  onResetDefault: () => void;
}

export const ManifestManager: React.FC<ManifestManagerProps> = ({
  manifest,
  setManifest,
  onResetDefault,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({
    'course-val-radiant-aim': true,
    'course-lol-challenger-macro': true,
  });
  const [viewRawJson, setViewRawJson] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(manifest, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats calculation
  const totalCourses = manifest.courses.length;
  const totalModules = manifest.courses.reduce((acc, c) => acc + c.modules.length, 0);
  const totalVideos = manifest.courses.reduce(
    (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.videos.length, 0),
    0
  );
  const selectedVideos = manifest.courses.reduce(
    (acc, c) =>
      c.selected !== false
        ? acc +
          c.modules.reduce(
            (mAcc, m) =>
              mAcc + m.videos.filter((v) => v.selected !== false).length,
            0
          )
        : acc,
    0
  );

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const handleToggleCourseSelect = (courseId: string) => {
    setManifest((prev) => {
      const updatedCourses = prev.courses.map((course) => {
        if (course.id === courseId) {
          const newSelected = course.selected === false;
          return {
            ...course,
            selected: newSelected,
            modules: course.modules.map((m) => ({
              ...m,
              videos: m.videos.map((v) => ({ ...v, selected: newSelected })),
            })),
          };
        }
        return course;
      });
      return { ...prev, courses: updatedCourses };
    });
  };

  const handleToggleVideoSelect = (courseId: string, videoId: string) => {
    setManifest((prev) => {
      const updatedCourses = prev.courses.map((course) => {
        if (course.id === courseId) {
          const updatedModules = course.modules.map((module) => ({
            ...module,
            videos: module.videos.map((video) =>
              video.id === videoId
                ? { ...video, selected: video.selected === false }
                : video
            ),
          }));
          const anyVideoSelected = updatedModules.some((m) =>
            m.videos.some((v) => v.selected !== false)
          );
          return {
            ...course,
            selected: anyVideoSelected,
            modules: updatedModules,
          };
        }
        return course;
      });
      return { ...prev, courses: updatedCourses };
    });
  };

  const handleSelectAll = (select: boolean) => {
    setManifest((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => ({
        ...c,
        selected: select,
        modules: c.modules.map((m) => ({
          ...m,
          videos: m.videos.map((v) => ({ ...v, selected: select })),
        })),
      })),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Normalize if user uploads array or wrapped object
        let normalizedCourses: CourseItem[] = [];
        if (Array.isArray(parsed)) {
          normalizedCourses = parsed;
        } else if (parsed.courses && Array.isArray(parsed.courses)) {
          normalizedCourses = parsed.courses;
        } else {
          throw new Error('Unrecognized manifest format. Must contain a "courses" list or array of courses.');
        }

        // Ensure selection property
        normalizedCourses = normalizedCourses.map((c, i) => ({
          ...c,
          id: c.id || `course-${i}`,
          selected: true,
          modules: (c.modules || []).map((m, mi) => ({
            ...m,
            id: m.id || `mod-${i}-${mi}`,
            index: m.index || mi + 1,
            videos: (m.videos || []).map((v, vi) => ({
              ...v,
              id: v.id || `vid-${i}-${mi}-${vi}`,
              selected: true,
            })),
          })),
        }));

        const newManifest: ManifestData = {
          courses: normalizedCourses,
          metadata: {
            exportedAt: new Date().toISOString(),
            source: file.name,
            totalVideos: normalizedCourses.reduce(
              (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.videos.length, 0),
              0
            ),
          },
        };

        setManifest(newManifest);
        setJsonText(JSON.stringify(newManifest, null, 2));
        setJsonError(null);
      } catch (err: any) {
        setJsonError(`Failed to parse uploaded JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyJsonText = () => {
    try {
      const parsed = JSON.parse(jsonText);
      let normalizedCourses: CourseItem[] = [];
      if (Array.isArray(parsed)) {
        normalizedCourses = parsed;
      } else if (parsed.courses && Array.isArray(parsed.courses)) {
        normalizedCourses = parsed.courses;
      } else {
        throw new Error('JSON structure must include "courses" array or be an array of course objects.');
      }

      setManifest({
        courses: normalizedCourses,
        metadata: parsed.metadata || {
          exportedAt: new Date().toISOString(),
          source: 'Manual Editor',
        },
      });
      setJsonError(null);
      setViewRawJson(false);
    } catch (err: any) {
      setJsonError(`Invalid JSON: ${err.message}`);
    }
  };

  const handleDownloadManifestJson = () => {
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skillcapped_course_videos_authed.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter courses by search
  const filteredCourses = manifest.courses.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const courseMatch =
      c.title.toLowerCase().includes(query) ||
      (c.game && c.game.toLowerCase().includes(query)) ||
      (c.instructor && c.instructor.toLowerCase().includes(query));

    const videoMatch = c.modules.some((m) =>
      m.videos.some((v) => v.title.toLowerCase().includes(query))
    );

    return courseMatch || videoMatch;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls & Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <FileJson className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  skillcapped_course_videos_authed.json
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  Active Manifest
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect stream URLs, select individual courses/videos to archive, or upload custom manifest.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              id="upload-manifest-btn"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-orange-400" />
              <span>Upload JSON</span>
            </button>

            <button
              id="download-manifest-btn"
              onClick={handleDownloadManifestJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save JSON</span>
            </button>

            <button
              id="toggle-raw-json-btn"
              onClick={() => {
                setJsonText(JSON.stringify(manifest, null, 2));
                setViewRawJson(!viewRawJson);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                viewRawJson
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>{viewRawJson ? 'Tree View' : 'Raw JSON'}</span>
            </button>

            <button
              id="reset-manifest-btn"
              onClick={onResetDefault}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs rounded-lg transition-colors"
              title="Reset to default sample manifest"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">Courses</span>
            <p className="text-xl font-bold text-white mt-0.5">{totalCourses}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">Modules</span>
            <p className="text-xl font-bold text-white mt-0.5">{totalModules}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-medium">Total Videos</span>
            <p className="text-xl font-bold text-white mt-0.5">{totalVideos}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-orange-400 font-medium">Queued for Colab</span>
            <p className="text-xl font-bold text-orange-400 mt-0.5">
              {selectedVideos} <span className="text-xs text-slate-400 font-normal">/ {totalVideos}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Raw JSON Editor View */}
      {viewRawJson ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Raw Manifest JSON Editor
            </h4>
            <button
              onClick={handleApplyJsonText}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-lg transition-colors"
            >
              Apply JSON Changes
            </button>
          </div>

          {jsonError && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={18}
            className="w-full mt-3 bg-slate-950 font-mono text-xs text-amber-200/90 border border-slate-800 rounded-xl p-3.5 focus:outline-none focus:border-orange-500/50"
            spellCheck={false}
          />
        </div>
      ) : (
        /* Interactive Tree View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Search & Bulk Select Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses, modules, or lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectAll(true)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => handleSelectAll(false)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-lg transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Courses List */}
          <div className="space-y-3">
            {filteredCourses.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No courses match your search query "{searchQuery}".
              </div>
            ) : (
              filteredCourses.map((course, cIdx) => {
                const isExpanded = !!expandedCourses[course.id];
                const courseVideosCount = course.modules.reduce(
                  (acc, m) => acc + m.videos.length,
                  0
                );
                const selectedCourseVideosCount = course.modules.reduce(
                  (acc, m) =>
                    acc + m.videos.filter((v) => v.selected !== false).length,
                  0
                );
                const isAllSelected = course.selected !== false && selectedCourseVideosCount === courseVideosCount;

                return (
                  <div
                    key={course.id}
                    className="border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden transition-colors"
                  >
                    {/* Course Header */}
                    <div className="p-3.5 flex items-center justify-between bg-slate-950 hover:bg-slate-900/80 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleCourseSelect(course.id)}
                          className="text-slate-400 hover:text-orange-400 transition-colors"
                        >
                          {isAllSelected ? (
                            <CheckSquare className="h-4 w-4 text-orange-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => toggleCourseExpand(course.id)}
                          className="flex items-center space-x-2 text-left flex-1 min-w-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="text-xs font-bold text-white mr-2">
                              {cIdx + 1}. {course.title}
                            </span>
                            {course.game && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-medium mr-2">
                                {course.game}
                              </span>
                            )}
                            {course.instructor && (
                              <span className="text-[11px] text-slate-400 hidden sm:inline">
                                by {course.instructor}
                              </span>
                            )}
                          </div>
                        </button>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-400 shrink-0 ml-2">
                        <span className="font-mono text-[11px]">
                          {selectedCourseVideosCount}/{courseVideosCount} videos
                        </span>
                        {course.totalDuration && (
                          <span className="flex items-center gap-1 text-[11px] hidden md:flex">
                            <Clock className="h-3 w-3" />
                            {course.totalDuration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Modules & Videos */}
                    {isExpanded && (
                      <div className="border-t border-slate-800/80 p-3 space-y-3 bg-slate-950/20">
                        {course.modules.map((module) => (
                          <div
                            key={module.id}
                            className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                              <div className="flex items-center gap-2">
                                <Layers className="h-3.5 w-3.5 text-amber-400" />
                                <span>
                                  Module {module.index}: {module.title}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {module.videos.length} videos
                              </span>
                            </div>

                            {/* Video list in Module */}
                            <div className="space-y-1 pl-2 pt-1">
                              {module.videos.map((vid, vIdx) => {
                                const isVidSelected = vid.selected !== false;
                                return (
                                  <div
                                    key={vid.id}
                                    className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors ${
                                      isVidSelected
                                        ? 'bg-slate-950/80 border border-slate-800/80 text-slate-200'
                                        : 'bg-slate-950/30 text-slate-400 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                      <button
                                        onClick={() =>
                                          handleToggleVideoSelect(
                                            course.id,
                                            vid.id
                                          )
                                        }
                                        className="text-slate-400 hover:text-orange-400 transition-colors"
                                      >
                                        {isVidSelected ? (
                                          <CheckSquare className="h-3.5 w-3.5 text-orange-400" />
                                        ) : (
                                          <Square className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                      <Video className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                      <span className="truncate font-medium">
                                        {vIdx + 1}. {vid.title}
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-[11px] shrink-0 ml-2 font-mono">
                                      {vid.duration && (
                                        <span className="text-slate-400">
                                          {vid.duration}
                                        </span>
                                      )}
                                      <span className="px-1.5 py-0.5 bg-slate-800 text-amber-400 rounded text-[10px]">
                                        {vid.streamType || 'm3u8'}
                                      </span>
                                      {vid.resolution && (
                                        <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-300 border border-blue-800/40 rounded text-[10px]">
                                          {vid.resolution}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
