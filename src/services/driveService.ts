/**
 * Real Google Drive REST API service
 * Uses OAuth 2.0 Access Token to inspect, create folders, upload metadata/manifests,
 * and track saved video files directly in the user's Google Drive.
 */

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface DriveFolderStructure {
  rootFolderId: string;
  courseFolders: Record<string, string>; // Course Name -> Folder ID
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

/**
 * List files and folders created or owned in Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  parentFolderId?: string
): Promise<DriveFileItem[]> {
  let query = "trashed = false";
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const url = `${DRIVE_API_URL}?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,iconLink)&pageSize=100&orderBy=folder,name`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Find or create a specific folder in Google Drive
 */
export async function getOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFileItem> {
  let q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(
    /'/g,
    "\\'"
  )}' and trashed = false`;
  if (parentFolderId) {
    q += ` and '${parentFolderId}' in parents`;
  }

  const searchRes = await fetch(
    `${DRIVE_API_URL}?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
  }

  // Create new folder
  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createRes = await fetch(DRIVE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create folder ${folderName}`);
  }

  return await createRes.json();
}

/**
 * Read text/JSON content of a file in Google Drive by name and parentFolderId
 */
export async function getDriveFileContent(
  accessToken: string,
  fileName: string,
  parentFolderId?: string
): Promise<{ file: DriveFileItem; content: string } | null> {
  let q = `name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`;
  if (parentFolderId) {
    q += ` and '${parentFolderId}' in parents`;
  }

  const searchUrl = `${DRIVE_API_URL}?q=${encodeURIComponent(
    q
  )}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  if (!searchData.files || searchData.files.length === 0) return null;

  const targetFile: DriveFileItem = searchData.files[0];
  const downloadRes = await fetch(`${DRIVE_API_URL}/${targetFile.id}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!downloadRes.ok) return null;
  const textContent = await downloadRes.text();
  return { file: targetFile, content: textContent };
}

/**
 * Upload a JSON or Text file (such as manifest or download log) to Google Drive
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = 'application/json',
  parentFolderId?: string
): Promise<DriveFileItem> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: Record<string, any> = {
    name: fileName,
    mimeType: mimeType,
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload ${fileName} to Drive`);
  }

  return await response.json();
}

/**
 * Provision the entire course folder hierarchy in Google Drive
 */
export async function provisionDriveCourseHierarchy(
  accessToken: string,
  rootFolderName: string,
  courseTitles: string[]
): Promise<{ rootFolder: DriveFileItem; createdCourses: DriveFileItem[] }> {
  // 1. Create or get root folder
  const root = await getOrCreateFolder(accessToken, rootFolderName);

  // 2. Create course subfolders
  const createdCourses: DriveFileItem[] = [];
  for (const title of courseTitles) {
    const courseFolder = await getOrCreateFolder(accessToken, title, root.id);
    createdCourses.push(courseFolder);
  }

  return { rootFolder: root, createdCourses };
}
