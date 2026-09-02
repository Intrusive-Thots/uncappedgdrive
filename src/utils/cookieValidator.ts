import { CookieEntry } from '../types';

export function parseNetscapeCookies(rawText: string): {
  entries: CookieEntry[];
  validCount: number;
  invalidCount: number;
  domains: string[];
  hasAuthCookies: boolean;
  warnings: string[];
} {
  const lines = rawText.split('\n');
  const entries: CookieEntry[] = [];
  let validCount = 0;
  let invalidCount = 0;
  const domainSet = new Set<string>();
  const warnings: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#')) {
      continue;
    }

    const parts = rawLine.split('\t');
    if (parts.length >= 7) {
      const domain = parts[0].trim();
      const flag = parts[1].trim().toUpperCase() === 'TRUE';
      const path = parts[2].trim();
      const secure = parts[3].trim().toUpperCase() === 'TRUE';
      const expiration = parseInt(parts[4].trim(), 10) || 0;
      const name = parts[5].trim();
      const value = parts.slice(6).join('\t').trim();

      domainSet.add(domain);
      validCount++;

      // Check for expiration
      const nowEpoch = Math.floor(Date.now() / 1000);
      const isExpired = expiration > 0 && expiration < nowEpoch;

      if (isExpired) {
        warnings.push(`Cookie "${name}" on domain "${domain}" appears to be expired.`);
      }

      entries.push({
        domain,
        flag,
        path,
        secure,
        expiration,
        name,
        value,
        isValid: !isExpired
      });
    } else {
      invalidCount++;
    }
  }

  const domains = Array.from(domainSet);
  const hasAuthCookies = entries.some(c => 
    c.name.toLowerCase().includes('token') || 
    c.name.toLowerCase().includes('session') || 
    c.name.toLowerCase().includes('auth') || 
    c.name.toLowerCase().includes('jwt') ||
    c.name.toLowerCase().includes('cloudfront')
  );

  return {
    entries,
    validCount,
    invalidCount,
    domains,
    hasAuthCookies,
    warnings
  };
}

/**
 * Converts JSON cookie array (exported from Chrome/Firefox Cookie extensions)
 * into standard Netscape HTTP Cookie format required by yt-dlp and aria2.
 */
export function jsonToNetscapeCookies(jsonTextOrObj: string | any[]): string {
  let cookieList: any[] = [];
  if (typeof jsonTextOrObj === 'string') {
    try {
      const parsed = JSON.parse(jsonTextOrObj.trim());
      cookieList = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return '';
    }
  } else if (Array.isArray(jsonTextOrObj)) {
    cookieList = jsonTextOrObj;
  }

  if (!cookieList || cookieList.length === 0) return '';

  const lines = [
    '# Netscape HTTP Cookie File',
    '# https://curl.haxx.se/rfc/cookie_spec.html',
    '# Converted from JSON browser cookie export',
    ''
  ];

  for (const c of cookieList) {
    if (!c || !c.name) continue;
    const domain = (c.domain || '.skill-capped.com').trim();
    const includeSubdomains = domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const path = c.path || '/';
    const secure = c.secure ? 'TRUE' : 'FALSE';
    const expiration = Math.floor(c.expirationDate || c.expires || (Date.now() / 1000 + 86400 * 30));
    const name = c.name;
    const value = c.value || '';

    lines.push(`${domain}\t${includeSubdomains}\t${path}\t${secure}\t${expiration}\t${name}\t${value}`);
  }

  return lines.join('\n') + '\n';
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}
