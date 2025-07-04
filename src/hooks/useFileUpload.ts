import { useState, useCallback } from 'react';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadTime: string;
}

export const useFileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('不支持的文件格式。请上传 JPG、PNG、GIF 或 WebP 格式的图片。');
      return false;
    }

    if (file.size > maxSize) {
      alert('文件大小超过限制。请上传小于 10MB 的图片。');
      return false;
    }

    return true;
  };

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      if (validateFile(file)) {
        const url = URL.createObjectURL(file);
        const uploadedFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          url,
          uploadTime: new Date().toLocaleString('zh-CN'),
        };
        newFiles.push(uploadedFile);
      }
    }

    setFiles(prev => [...newFiles, ...prev]);
    setIsUploading(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const clearAllFiles = useCallback(() => {
    files.forEach(file => URL.revokeObjectURL(file.url));
    setFiles([]);
  }, [files]);

  const copyToClipboard = useCallback(async (file: UploadedFile) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        return true;
      } else {
        // 降级方案：复制文件URL
        await navigator.clipboard.writeText(file.url);
        return true;
      }
    } catch (error) {
      console.error('复制失败:', error);
      return false;
    }
  }, []);

  return {
    files,
    isDragging,
    isUploading,
    setIsDragging,
    processFiles,
    removeFile,
    clearAllFiles,
    copyToClipboard,
  };
};