import React, { useRef, type FC } from 'react';
import { Box, Text, Button, Flex } from '@radix-ui/themes';
import { UploadIcon } from '@radix-ui/react-icons';
import './index.css';

interface FileUploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  isDragging: boolean;
  onDragStateChange: (isDragging: boolean) => void;
  isUploading: boolean;
}

const FileUploadZone: FC<FileUploadZoneProps> = ({
  onFilesSelected,
  isDragging,
  onDragStateChange,
  isUploading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开整个拖拽区域时才设置为false
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      onDragStateChange(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStateChange(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box
      className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
    >
      <Flex direction="column" align="center" justify="center" gap="4" py="8">
        <Box className="upload-icon">
          <UploadIcon width="32" height="32" />
        </Box>
        <Box style={{ textAlign: 'center' }}>
          <Text size="4" weight="medium" mb="2" style={{ color: 'var(--gray-12)' }}>
            {isUploading ? '正在处理文件...' : isDragging ? '释放文件以上传' : '拖拽或点击上传图片'}
          </Text>
          <Text size="2" style={{ color: 'var(--gray-10)' }}>
            支持 JPG、PNG、GIF、WebP 格式，最大 10MB
          </Text>
        </Box>
        {!isUploading && (
          <Button size="3" variant="soft" disabled={isUploading}>
            <UploadIcon width="16" height="16" />
            选择文件
          </Button>
        )}
      </Flex>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        disabled={isUploading}
      />
    </Box>
  );
};

export default FileUploadZone;