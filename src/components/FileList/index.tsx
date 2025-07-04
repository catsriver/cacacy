import React, { type FC } from 'react';
import { Box, Text, Card, Flex, Button, Badge, IconButton } from '@radix-ui/themes';
import { 
  ImageIcon, 
  CopyIcon, 
  DownloadIcon, 
  TrashIcon, 
  CheckIcon,
  Cross2Icon 
} from '@radix-ui/react-icons';
import type { UploadedFile } from '../../hooks/useFileUpload';
import './index.css';

interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onCopyToClipboard: (file: UploadedFile) => Promise<boolean>;
}

const FileList: FC<FileListProps> = ({
  files,
  onRemoveFile,
  onClearAll,
  onCopyToClipboard,
}) => {
  const [copiedFiles, setCopiedFiles] = React.useState<Set<string>>(new Set());

  const handleCopy = async (file: UploadedFile) => {
    const success = await onCopyToClipboard(file);
    if (success) {
      setCopiedFiles(prev => new Set([...prev, file.id]));
      setTimeout(() => {
        setCopiedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.id);
          return newSet;
        });
      }, 2000);
    }
  };

  const handleDownload = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (files.length === 0) {
    return (
      <Card>
        <Text size="4" weight="medium" mb="4">
          最近使用
        </Text>
        <Box 
          p="6" 
          style={{ 
            background: 'var(--gray-2)', 
            borderRadius: '8px',
            border: '1px solid var(--gray-6)',
            textAlign: 'center'
          }}
        >
          <Box 
            mb="3"
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              background: 'var(--gray-6)', 
              borderRadius: '50%'
            }}
          >
            <ImageIcon width="24" height="24" style={{ color: 'var(--gray-10)' }} />
          </Box>
          <Text size="3" weight="medium" mb="1" style={{ display: 'block' }}>
            暂无上传记录
          </Text>
          <Text size="2" style={{ color: 'var(--gray-10)' }}>
            上传图片后，这里会显示文件列表和操作选项
          </Text>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Flex align="center" justify="between" mb="4">
        <Flex align="center" gap="2">
          <Text size="4" weight="medium">
            已上传文件
          </Text>
          <Badge variant="soft" color="blue">
            {files.length}
          </Badge>
        </Flex>
        <Button variant="soft" size="2" color="red" onClick={onClearAll}>
          <TrashIcon width="14" height="14" />
          清空全部
        </Button>
      </Flex>

      <Flex direction="column" gap="3">
        {files.map((file) => (
          <Box 
            key={file.id}
            className="file-item"
            p="3" 
            style={{ 
              background: 'var(--gray-2)', 
              borderRadius: '8px',
              border: '1px solid var(--gray-6)',
              transition: 'all 0.2s ease'
            }}
          >
            <Flex align="center" gap="3">
              {/* 文件预览 */}
              <Box 
                className="file-preview"
                width="60px" 
                height="60px" 
                style={{ 
                  borderRadius: '6px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--gray-6)'
                }}
              >
                <img 
                  src={file.url} 
                  alt={file.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>

              {/* 文件信息 */}
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="3" weight="medium" mb="1" style={{ 
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file.name}
                </Text>
                <Flex align="center" gap="3" mb="1">
                  <Text size="2" style={{ color: 'var(--gray-10)' }}>
                    {file.size}
                  </Text>
                  <Badge variant="soft" size="1">
                    {file.type.split('/')[1].toUpperCase()}
                  </Badge>
                </Flex>
                <Text size="1" style={{ color: 'var(--gray-9)' }}>
                  {file.uploadTime}
                </Text>
              </Box>

              {/* 操作按钮 */}
              <Flex gap="2" align="center">
                <Button 
                  variant="soft" 
                  size="2"
                  onClick={() => handleCopy(file)}
                  disabled={copiedFiles.has(file.id)}
                  style={{ minWidth: '80px' }}
                >
                  {copiedFiles.has(file.id) ? (
                    <>
                      <CheckIcon width="14" height="14" />
                      已复制
                    </>
                  ) : (
                    <>
                      <CopyIcon width="14" height="14" />
                      复制
                    </>
                  )}
                </Button>
                <IconButton 
                  variant="soft" 
                  size="2"
                  onClick={() => handleDownload(file)}
                >
                  <DownloadIcon width="14" height="14" />
                </IconButton>
                <IconButton 
                  variant="soft" 
                  size="2" 
                  color="red"
                  onClick={() => onRemoveFile(file.id)}
                >
                  <Cross2Icon width="14" height="14" />
                </IconButton>
              </Flex>
            </Flex>
          </Box>
        ))}
      </Flex>
    </Card>
  );
};

export default FileList;