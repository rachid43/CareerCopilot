// This file provides client-side file parsing utilities
// The actual parsing is done on the server, but we can add
// client-side validation and preview functionality here

export function validateFile(file: File): { valid: boolean; error?: string } {
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload PDF or DOCX files only'
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB'
    };
  }

  return { valid: true };
}

export function getFileIcon(type: string): string {
  if (type === 'application/pdf') {
    return '📄';
  } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return '📝';
  }
  return '📄';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
