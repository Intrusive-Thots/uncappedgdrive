import { ManifestData } from '../types';

export const SAMPLE_MANIFEST: ManifestData = {
  metadata: {
    exportedAt: '2026-09-02T13:00:00Z',
    source: 'SkillCapped Member Archive',
    version: '2.4.0',
    totalVideos: 14,
    authenticatedUser: 'pro_member_772@skill-capped.com'
  },
  courses: [
    {
      id: 'course-val-radiant-aim',
      title: 'Radiant Mechanics & Aim Mastery 2026',
      game: 'Valorant',
      instructor: 'Coach Sova & Deth',
      totalDuration: '1h 48m',
      selected: true,
      modules: [
        {
          id: 'mod-1-foundations',
          title: 'Crosshair Placement & Micro-Adjustments',
          index: 1,
          videos: [
            {
              id: 'vid-val-101',
              title: 'The Golden Angle Rule on Ascent & Haven',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/val-radiant-aim/101_crosshair_placement.m3u8',
              duration: '14:22',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            },
            {
              id: 'vid-val-102',
              title: 'Micro-flicks vs Lazy Pre-aiming Drills',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/val-radiant-aim/102_micro_flicks.m3u8',
              duration: '18:45',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            },
            {
              id: 'vid-val-103',
              title: 'Counter-Strafing & Dead-Zoning Mastery',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/val-radiant-aim/103_counter_strafing.m3u8',
              duration: '12:10',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            }
          ]
        },
        {
          id: 'mod-2-peeking',
          title: 'Advanced Peeking Techniques & Duel Theory',
          index: 2,
          videos: [
            {
              id: 'vid-val-201',
              title: 'Ferrari Peeking, Jump-Peeks, & Jiggle Slicing',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/val-radiant-aim/201_peeking_techniques.m3u8',
              duration: '16:04',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            },
            {
              id: 'vid-val-202',
              title: 'Camera Angle Disadvantage & Perspective Math',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/val-radiant-aim/202_perspective_angles.m3u8',
              duration: '15:30',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            }
          ]
        }
      ]
    },
    {
      id: 'course-lol-challenger-macro',
      title: 'Challenger Wave Management & Map State',
      game: 'League of Legends',
      instructor: 'Midbeast & Curtis',
      totalDuration: '2h 15m',
      selected: true,
      modules: [
        {
          id: 'mod-lol-1-waves',
          title: 'Crash Timings, Cheater Recalls & Bounces',
          index: 1,
          videos: [
            {
              id: 'vid-lol-101',
              title: '3-Wave Slow Push into Guaranteed Cheater Recall',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/lol-macro/101_cheater_recalls.m3u8',
              duration: '19:12',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            },
            {
              id: 'vid-lol-102',
              title: 'Breaking Freezes When Behind Without Dying',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/lol-macro/102_freeze_breaking.m3u8',
              duration: '14:50',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            },
            {
              id: 'vid-lol-103',
              title: 'Cannon Wave Priorities & Tempo Resets',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/lol-macro/103_cannon_tempo.m3u8',
              duration: '11:40',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            }
          ]
        },
        {
          id: 'mod-lol-2-tempo',
          title: 'Mid-Game Side Laning & Objective Conversion',
          index: 2,
          videos: [
            {
              id: 'vid-lol-201',
              title: '1-3-1 vs 4-1 Baron Setup Execution',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/lol-macro/201_baron_rotations.m3u8',
              duration: '22:15',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            },
            {
              id: 'vid-lol-202',
              title: 'Fog of War Traps Around Dragon Soul Spawns',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/lol-macro/202_dragon_soul_fog.m3u8',
              duration: '17:35',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            }
          ]
        }
      ]
    },
    {
      id: 'course-cs2-utility-secrets',
      title: 'CS2 Premier Tactical Utility & Site Takes',
      game: 'Counter-Strike 2',
      instructor: 'Pimp & Launders',
      totalDuration: '1h 32m',
      selected: true,
      modules: [
        {
          id: 'mod-cs2-mirage',
          title: 'Mirage Complete Smoke & Flash Lineups',
          index: 1,
          videos: [
            {
              id: 'vid-cs2-101',
              title: 'A-Site Instant Execute: Stairs, Jungle, CT',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/cs2-utility/101_mirage_a_site.m3u8',
              duration: '13:55',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            },
            {
              id: 'vid-cs2-102',
              title: 'Mid Window Jump-Throw Smokes from T-Spawn',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/cs2-utility/102_mirage_window.m3u8',
              duration: '10:20',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            },
            {
              id: 'vid-cs2-103',
              title: 'B-Apartments God Flashes & Short Molotovs',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/cs2-utility/103_mirage_b_site.m3u8',
              duration: '15:10',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            },
            {
              id: 'vid-cs2-104',
              title: 'Retake Protocols & Fake Defuse Smokes',
              url: 'https://manifest.prod.skill-capped.com/hls/courses/cs2-utility/104_retake_protocols.m3u8',
              duration: '12:40',
              resolution: '1080p60',
              streamType: 'm3u8',
              selected: true
            }
          ]
        }
      ]
    }
  ]
};

export const SAMPLE_COOKIES_TXT = `# Netscape HTTP Cookie File
# https://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file! Do not edit.

.skill-capped.com\tTRUE\t/\tFALSE\t1822940816\t_ga\tGA1.1.443580130.1785647986
.skill-capped.com\tTRUE\t/\tFALSE\t1793423986\t_gcl_au\t1.1.1354906779.1785647986
.skill-capped.com\tTRUE\t/\tFALSE\t1822941653\t_ga_C4VWRB6FWB\tGS2.1.s1788376372$o7$g1$t1788381653$j60$l0$h0
.skill-capped.com\tTRUE\t/\tTRUE\t1798765432\tsession_id\ts_cap_auth_98471928374918237491
.skill-capped.com\tTRUE\t/\tTRUE\t1798765432\tjwt_token\teyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.skillcapped.member.archive
.skill-capped.com\tTRUE\t/\tTRUE\t1798765432\tuser_subscription\tpro_yearly_active
.skill-capped.com\tTRUE\t/\tTRUE\t1798765432\tcf_clearance\ti7qZ8k2L990vBn2_skillcapped_bypass
manifest.prod.skill-capped.com\tFALSE\t/\tTRUE\t1798765432\tCloudFront-Key-Pair-Id\tAPKAJTESTKEYPAIRID
manifest.prod.skill-capped.com\tFALSE\t/\tTRUE\t1798765432\tCloudFront-Policy\teyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9tYW5pZmVzdC5wcm9kLnNraWxsLWNhcHBlZC5jb20vKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2NTQzMn19fV19
manifest.prod.skill-capped.com\tFALSE\t/\tTRUE\t1798765432\tCloudFront-Signature\tSig_ABC123XYZ_skillcapped_stream_token
`;

export const SAMPLE_TARGET_URLS_TXT = `# SkillCapped Target Course & Syllabus Scraper List
# Automated video scraper reads this file alongside cookies.txt and manifest
# Format: Course URL or Syllabus Link (one per line)

https://www.skill-capped.com/courses/val-radiant-aim
https://www.skill-capped.com/courses/lol-macro
https://www.skill-capped.com/courses/cs2-utility
https://www.skill-capped.com/courses/val-clutch-psychology
https://www.skill-capped.com/courses/lol-teamfight-positioning
`;

