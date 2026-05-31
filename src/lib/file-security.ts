/**
 * File Upload Security Validator
 * Validates file types, extensions, MIME types and sizes
 * to prevent malicious uploads.
 */

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.rtf'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'],
  identity: ['.jpg', '.jpeg', '.png', '.pdf', '.heic', '.heif'],
  signature: ['.png', '.jpg', '.jpeg'],
  tax: ['.pdf', '.csv', '.xls', '.xlsx', '.doc', '.docx', '.txt'],
};

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'application/rtf',
  ],
  image: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/bmp', 'image/heic', 'image/heif',
  ],
  identity: ['image/jpeg', 'image/png', 'application/pdf', 'image/heic', 'image/heif'],
  signature: ['image/png', 'image/jpeg'],
  tax: [
    'application/pdf', 'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
};

// Dangerous extensions that should NEVER be uploaded
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.js', '.vbs', '.wsf', '.wsh', '.ps1', '.psm1',
  '.sh', '.bash', '.csh', '.ksh',
  '.app', '.action', '.command',
  '.dll', '.so', '.dylib',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl',
  '.html', '.htm', '.svg', '.xml', '.xhtml',
  '.jar', '.class', '.war',
  '.reg', '.inf', '.lnk',
  '.iso', '.dmg', '.deb', '.rpm',
];

const MAX_FILE_SIZES: Record<string, number> = {
  document: 20 * 1024 * 1024,   // 20MB
  image: 10 * 1024 * 1024,      // 10MB
  identity: 10 * 1024 * 1024,   // 10MB
  signature: 5 * 1024 * 1024,   // 5MB
  tax: 20 * 1024 * 1024,        // 20MB
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings: string[];
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

function hasDoubleExtension(filename: string): boolean {
  const parts = filename.split('.');
  return parts.length > 2;
}

export function validateUploadFile(
  file: File,
  category: keyof typeof ALLOWED_EXTENSIONS = 'document'
): FileValidationResult {
  const warnings: string[] = [];
  const ext = getExtension(file.name);

  // 1. Block dangerous extensions
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File type "${ext}" is not allowed for security reasons.`, warnings };
  }

  // 2. Check double extensions (e.g., file.pdf.exe)
  if (hasDoubleExtension(file.name)) {
    const parts = file.name.split('.');
    const lastExt = '.' + parts[parts.length - 1].toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(lastExt)) {
      return { valid: false, error: `File appears to have a dangerous hidden extension.`, warnings };
    }
    warnings.push('File has multiple extensions — please verify it is the correct file.');
  }

  // 3. Check allowed extensions
  const allowedExts = ALLOWED_EXTENSIONS[category] || ALLOWED_EXTENSIONS.document;
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `File type "${ext}" is not accepted. Allowed: ${allowedExts.join(', ')}`,
      warnings,
    };
  }

  // 4. Check MIME type
  const allowedMimes = ALLOWED_MIME_TYPES[category] || ALLOWED_MIME_TYPES.document;
  if (file.type && !allowedMimes.includes(file.type)) {
    // MIME mismatch — possible spoofing
    warnings.push(`File MIME type (${file.type}) does not match expected types. The file will be checked on upload.`);
  }

  // 5. Check file size
  const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.document;
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxMB}MB.`,
      warnings,
    };
  }

  // 6. Check empty file
  if (file.size === 0) {
    return { valid: false, error: 'File appears to be empty.', warnings };
  }

  return { valid: true, warnings };
}

/**
 * Sanitize a filename for safe storage.
 * Strips path traversal, null bytes, and special chars.
 */
export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/\0/g, '')                 // Remove null bytes
    .replace(/\.\./g, '')               // Remove path traversal
    .replace(/[/\\]/g, '')              // Remove path separators
    .replace(/[<>:"|?*]/g, '_')         // Replace unsafe chars
    .replace(/\s+/g, '_')              // Replace whitespace
    .slice(0, 200);                     // Limit length
}
