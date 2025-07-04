import React from 'react';
import { Box, Text, Card, Flex, Badge } from '@radix-ui/themes';
import { CopyIcon, ImageIcon } from '@radix-ui/react-icons';
import { useFileUpload } from '../../hooks/useFileUpload';
import FileUploadZone from '../../components/FileUploadZone';
import FileList from '../../components/FileList';

const Home = () => {
  const {
    files,
    isDragging,
    isUploading,
    setIsDragging,
    processFiles,
    removeFile,
    clearAllFiles,
    copyToClipboard,
  } = useFileUpload();

  const handleFilesSelected = (fileList: FileList) => {
    processFiles(fileList);
  };

  return (
    <Box>
      {/* 页面标题 */}
      <Box mb="6">
        <Flex align="center" gap="3" mb="2">
          <CopyIcon width="24" height="24" style={{ color: 'var(--accent-9)' }} />
          <Text size="6" weight="bold" style={{ color: 'var(--gray-12)' }}>
            图片拷贝工具
          </Text>
          <Badge color="green" variant="soft">
            活跃
          </Badge>
        </Flex>
        <Text size="3" style={{ color: 'var(--gray-11)' }}>
          快速复制和处理图片文件，支持多种格式和批量操作
        </Text>
      </Box>

      {/* 功能卡片 */}
      <Flex direction="column" gap="4">
        {/* 上传区域 */}
        <Card size="3">
          <FileUploadZone
            onFilesSelected={handleFilesSelected}
            isDragging={isDragging}
            onDragStateChange={setIsDragging}
            isUploading={isUploading}
          />
        </Card>

        {/* 功能介绍 */}
        <Flex gap="4" wrap="wrap">
          <Card flexGrow="1" style={{ minWidth: '280px' }}>
            <Flex align="center" gap="3" mb="3">
              <Box 
                p="2" 
                style={{ 
                  background: 'var(--blue-3)', 
                  borderRadius: '6px',
                  color: 'var(--blue-9)'
                }}
              >
                <CopyIcon width="16" height="16" />
              </Box>
              <Text size="4" weight="medium">
                快速复制
              </Text>
            </Flex>
            <Text size="2" style={{ color: 'var(--gray-11)', lineHeight: '1.5' }}>
              一键复制图片到剪贴板，支持直接粘贴到其他应用程序中使用
            </Text>
          </Card>

          <Card flexGrow="1" style={{ minWidth: '280px' }}>
            <Flex align="center" gap="3" mb="3">
              <Box 
                p="2" 
                style={{ 
                  background: 'var(--green-3)', 
                  borderRadius: '6px',
                  color: 'var(--green-9)'
                }}
              >
                <ImageIcon width="16" height="16" />
              </Box>
              <Text size="4" weight="medium">
                格式转换
              </Text>
            </Flex>
            <Text size="2" style={{ color: 'var(--gray-11)', lineHeight: '1.5' }}>
              支持多种图片格式之间的转换，保持高质量输出
            </Text>
          </Card>
        </Flex>

        {/* 文件列表 */}
        <FileList
          files={files}
          onRemoveFile={removeFile}
          onClearAll={clearAllFiles}
          onCopyToClipboard={copyToClipboard}
        />
      </Flex>
    </Box>
  );
};

export default Home;