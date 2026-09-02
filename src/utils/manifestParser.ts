import { ManifestData, CourseItem, ModuleItem, VideoItem } from '../types';

/**
 * Robust, universal parser that normalizes any SkillCapped JSON export or URL list
 * into a fully structured ManifestData object.
 *
 * Handles:
 * 1. SkillCapped authenticated JSON dumps (with course_id, course_title, course_url, and videos[] with chapter/video_id)
 * 2. Standard ManifestData format (with courses[].modules[].videos[])
 * 3. Flat course arrays: [{ course_id, course_title, videos: [...] }]
 * 4. Flat video lists: [{ title, url, course, chapter }]
 * 5. Array of URL strings: ["https://www.skill-capped.com/lol/browse/course/..."]
 * 6. Line-separated plaintext URLs or CSVs
 */
export function parseAndNormalizeManifest(
  rawInput: string | any,
  defaultGame = 'League of Legends'
): ManifestData {
  let parsed: any;

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return { courses: [] };
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (e: any) {
        // Fall back to line-by-line URL parsing
        return parseTextUrlList(trimmed, defaultGame);
      }
    } else {
      // Plain text list of URLs
      return parseTextUrlList(trimmed, defaultGame);
    }
  } else {
    parsed = rawInput;
  }

  if (!parsed) {
    return { courses: [] };
  }

  // Determine game from root if present (e.g. "lol" -> "League of Legends")
  let globalGame = defaultGame;
  if (parsed.game) {
    const g = String(parsed.game).toLowerCase();
    if (g === 'lol') globalGame = 'League of Legends';
    else if (g === 'valorant') globalGame = 'Valorant';
    else globalGame = parsed.game;
  }

  let rawCourseList: any[] = [];
  if (Array.isArray(parsed)) {
    // Array of courses or array of strings
    if (typeof parsed[0] === 'string') {
      return parseTextUrlList(parsed.join('\n'), defaultGame);
    }
    rawCourseList = parsed;
  } else if (parsed.courses && Array.isArray(parsed.courses)) {
    rawCourseList = parsed.courses;
  } else if (parsed.videos && Array.isArray(parsed.videos)) {
    // Single course with videos
    rawCourseList = [parsed];
  } else {
    // Check if it's an object of courses keyed by title or id
    const values = Object.values(parsed);
    if (values.length > 0 && typeof values[0] === 'object' && (values[0] as any).videos) {
      rawCourseList = values;
    } else {
      throw new Error('Unrecognized JSON structure. Expected a "courses" array or course objects.');
    }
  }

  const normalizedCourses: CourseItem[] = rawCourseList.map((rawCourse: any, cIdx: number) => {
    // Course ID
    const courseId =
      rawCourse.course_id ||
      rawCourse.id ||
      rawCourse.uuid ||
      `course-${cIdx + 1}`;

    // Course Title
    const courseTitle = (
      rawCourse.course_title ||
      rawCourse.title ||
      rawCourse.name ||
      `Course ${cIdx + 1}`
    ).trim();

    // Determine game / category (e.g., from title tags like {mid}, {adc}, {top}, {jungle}, {support}, {all})
    let game = rawCourse.game || globalGame;
    if (courseTitle.includes('{') && courseTitle.includes('}')) {
      const match = courseTitle.match(/\{([^}]+)\}/);
      if (match) {
        const role = match[1].toUpperCase();
        game = `${globalGame} (${role})`;
      }
    }

    // Process modules/videos
    let modules: ModuleItem[] = [];

    // Case 1: Course has already-nested modules
    if (Array.isArray(rawCourse.modules) && rawCourse.modules.length > 0) {
      modules = rawCourse.modules.map((m: any, mIdx: number) => {
        const modId = m.id || `mod-${courseId}-${mIdx + 1}`;
        const modTitle = m.title || m.name || `Module ${mIdx + 1}`;
        const modVideos: VideoItem[] = (m.videos || []).map((v: any, vIdx: number) => ({
          id: v.video_id || v.id || `vid-${courseId}-${mIdx + 1}-${vIdx + 1}`,
          title: v.title || v.name || `Lesson ${vIdx + 1}`,
          url: v.url || v.streamUrl || v.stream_url || '',
          duration: v.duration || '10:00',
          resolution: v.resolution || '1080p',
          moduleIndex: mIdx + 1,
          moduleTitle: modTitle,
          courseIndex: cIdx + 1,
          courseTitle: courseTitle,
          selected: v.selected !== false,
          streamType: (v.url || '').includes('.m3u8') ? 'm3u8' : 'mp4',
        }));

        return {
          id: modId,
          title: modTitle,
          index: m.index || mIdx + 1,
          videos: modVideos,
        };
      });
    }
    // Case 2: Course has a flat `videos` array (like the SkillCapped authenticated course dump)
    else if (Array.isArray(rawCourse.videos)) {
      // Group by chapter if available, or put all into "Course Content"
      const chapterMap = new Map<string, VideoItem[]>();

      rawCourse.videos.forEach((v: any, vIdx: number) => {
        const chapterName = (v.chapter || v.chapter_title || v.module || 'Course Content').trim();
        const videoId = v.video_id || v.id || v.uuid || `vid-${courseId}-${vIdx + 1}`;
        const videoTitle = (v.title || v.name || `Lesson ${vIdx + 1}`).trim();
        const videoUrl = v.url || v.streamUrl || v.stream_url || '';

        const item: VideoItem = {
          id: videoId,
          title: videoTitle,
          url: videoUrl,
          duration: v.duration || '10:00',
          resolution: v.resolution || '1080p',
          courseIndex: cIdx + 1,
          courseTitle: courseTitle,
          moduleTitle: chapterName,
          selected: v.selected !== false,
          streamType: videoUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
        };

        if (!chapterMap.has(chapterName)) {
          chapterMap.set(chapterName, []);
        }
        chapterMap.get(chapterName)!.push(item);
      });

      let modIndex = 1;
      for (const [chName, chVideos] of chapterMap.entries()) {
        const modId = `mod-${courseId}-${modIndex}`;
        chVideos.forEach((v) => {
          v.moduleIndex = modIndex;
        });

        modules.push({
          id: modId,
          title: chName,
          index: modIndex,
          videos: chVideos,
        });
        modIndex++;
      }

      // If empty videos array, add a placeholder empty module so structure is consistent
      if (modules.length === 0) {
        modules.push({
          id: `mod-${courseId}-1`,
          title: 'Course Content',
          index: 1,
          videos: [],
        });
      }
    } else {
      // Empty course
      modules.push({
        id: `mod-${courseId}-1`,
        title: 'Course Content',
        index: 1,
        videos: [],
      });
    }

    return {
      id: courseId,
      title: courseTitle,
      game: game,
      instructor: rawCourse.instructor || 'SkillCapped Master Coach',
      modules: modules,
      selected: rawCourse.selected !== false,
    };
  });

  const totalVideos = normalizedCourses.reduce(
    (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.videos.length, 0),
    0
  );

  return {
    courses: normalizedCourses,
    metadata: {
      exportedAt: parsed.scraped_at || parsed.metadata?.exportedAt || new Date().toISOString(),
      source: parsed.source || parsed.metadata?.source || 'SkillCapped Authenticated Dump',
      version: '2.1.0',
      totalVideos: totalVideos,
    },
  };
}

/**
 * Parses plain text lists of URLs (one per line or CSV) into courses
 */
export function parseTextUrlList(text: string, defaultGame = 'League of Legends'): ManifestData {
  const lines = text
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  const courseMap = new Map<string, CourseItem>();

  lines.forEach((line, lineIdx) => {
    let url = line;
    let customTitle = '';

    if (line.includes(',') && line.includes('http')) {
      const parts = line.split(',');
      const uPart = parts.find((p) => p.trim().startsWith('http'));
      const tPart = parts.find((p) => !p.trim().startsWith('http'));
      if (uPart) url = uPart.trim();
      if (tPart) customTitle = tPart.trim();
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return;
    }

    try {
      const parsedUrl = new URL(url);
      const segments = parsedUrl.pathname.split('/').filter(Boolean);

      // Analyze SkillCapped URL structures:
      // Pattern 1: /lol/browse/course/{videoId}/{courseId}
      // Pattern 2: /lol/courses/{courseSlug}/{videoSlug}
      let courseSlug = 'Course';
      let videoSlug = `Lesson ${lineIdx + 1}`;
      let detectedGame = defaultGame;

      if (segments.length >= 4 && segments[1] === 'browse' && segments[2] === 'course') {
        detectedGame = segments[0].toUpperCase();
        courseSlug = segments[3]; // courseId
        videoSlug = segments[2]; // videoId
      } else if (segments.length >= 3 && segments[1] === 'courses') {
        detectedGame = segments[0].toUpperCase();
        courseSlug = segments[2];
        videoSlug = segments[3] || `Lesson 1`;
      } else if (segments.length > 0) {
        courseSlug = segments[segments.length - 1];
      }

      const cleanCourse =
        customTitle ||
        courseSlug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const cleanVideo = videoSlug
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      if (!courseMap.has(cleanCourse)) {
        const cId = `course-pasted-${courseMap.size + 1}`;
        courseMap.set(cleanCourse, {
          id: cId,
          title: cleanCourse,
          game: detectedGame,
          selected: true,
          modules: [
            {
              id: `mod-${cId}-1`,
              title: 'Course Content',
              index: 1,
              videos: [],
            },
          ],
        });
      }

      const course = courseMap.get(cleanCourse)!;
      course.modules[0].videos.push({
        id: `vid-${course.id}-${course.modules[0].videos.length + 1}`,
        title: cleanVideo,
        url: url,
        duration: '10:00',
        resolution: '1080p',
        moduleIndex: 1,
        moduleTitle: course.modules[0].title,
        courseIndex: courseMap.size,
        courseTitle: course.title,
        selected: true,
        streamType: url.includes('.m3u8') ? 'm3u8' : 'mp4',
      });
    } catch {
      // Invalid URL skipped
    }
  });

  const courses = Array.from(courseMap.values());
  const totalVideos = courses.reduce(
    (acc, c) => acc + c.modules.reduce((mAcc, m) => mAcc + m.videos.length, 0),
    0
  );

  return {
    courses,
    metadata: {
      exportedAt: new Date().toISOString(),
      source: 'Pasted URL List',
      version: '2.1.0',
      totalVideos,
    },
  };
}
