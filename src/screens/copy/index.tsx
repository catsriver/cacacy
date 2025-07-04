import { Box, Text, Card, Flex, Badge } from '@radix-ui/themes'
import { FileTextIcon } from '@radix-ui/react-icons'
import { useExcelUpload } from '../../hooks/useExcelUpload'
import ExcelUploadZone from '../../components/ExcelUploadZone'
import ExcelViewer from '../../components/ExcelViewer'

const Copy = () => {
    const {
        currentFile,
        isDragging,
        isProcessing,
        setIsDragging,
        uploadFile,
        clearFile
    } = useExcelUpload()

    return (
        <Box>
            {/* 页面标题 */}
            <Box mb='6'>
                <Flex align='center' gap='3' mb='2'>
                    <FileTextIcon
                        width='24'
                        height='24'
                        style={{ color: 'var(--accent-9)' }}
                    />
                    <Text
                        size='6'
                        weight='bold'
                        style={{ color: 'var(--gray-12)' }}
                    >
                        Excel 解析工具
                    </Text>
                    <Badge color='blue' variant='soft'>
                        Beta
                    </Badge>
                </Flex>
                <Text size='3' style={{ color: 'var(--gray-11)' }}>
                    解析和处理 Excel 文件，支持数据提取、格式转换和批量处理
                </Text>
            </Box>

            {/* 功能卡片 */}
            <Flex direction='column' gap='4'>
                {/* 上传区域 */}
                <Card size='3'>
                    <ExcelUploadZone
                        onFileSelected={uploadFile}
                        isDragging={isDragging}
                        onDragStateChange={setIsDragging}
                        isProcessing={isProcessing}
                        hasFile={!!currentFile}
                    />
                </Card>

                {/* 功能介绍 */}
                {!currentFile && (
                    <Flex gap='4' wrap='wrap'>
                        <Card flexGrow='1' style={{ minWidth: '280px' }}>
                            <Flex align='center' gap='3' mb='3'>
                                <Box
                                    p='2'
                                    style={{
                                        background: 'var(--green-3)',
                                        borderRadius: '6px',
                                        color: 'var(--green-9)'
                                    }}
                                >
                                    <FileTextIcon width='16' height='16' />
                                </Box>
                                <Text size='4' weight='medium'>
                                    数据预览
                                </Text>
                            </Flex>
                            <Text
                                size='2'
                                style={{
                                    color: 'var(--gray-11)',
                                    lineHeight: '1.5'
                                }}
                            >
                                快速预览 Excel 文件内容和结构，支持多工作表切换
                            </Text>
                        </Card>

                        <Card flexGrow='1' style={{ minWidth: '280px' }}>
                            <Flex align='center' gap='3' mb='3'>
                                <Box
                                    p='2'
                                    style={{
                                        background: 'var(--orange-3)',
                                        borderRadius: '6px',
                                        color: 'var(--orange-9)'
                                    }}
                                >
                                    <FileTextIcon width='16' height='16' />
                                </Box>
                                <Text size='4' weight='medium'>
                                    格式转换
                                </Text>
                            </Flex>
                            <Text
                                size='2'
                                style={{
                                    color: 'var(--gray-11)',
                                    lineHeight: '1.5'
                                }}
                            >
                                转换为 CSV、JSON 等多种格式，保持数据完整性
                            </Text>
                        </Card>
                    </Flex>
                )}

                {/* Excel 文件查看器 */}
                {currentFile && (
                    <ExcelViewer file={currentFile} onClearFile={clearFile} />
                )}

                {/* 使用说明 */}
                {!currentFile && (
                    <Card>
                        <Text size='4' weight='medium' mb='4'>
                            使用说明
                        </Text>
                        <Flex direction='column' gap='3'>
                            <Box>
                                <Text size='3' weight='medium' mb='1'>
                                    1. 上传文件
                                </Text>
                                <Text
                                    size='2'
                                    style={{ color: 'var(--gray-11)' }}
                                >
                                    支持拖拽或点击上传单个 Excel 文件（.xlsx 或
                                    .xls 格式）
                                </Text>
                            </Box>
                            <Box>
                                <Text size='3' weight='medium' mb='1'>
                                    2. 预览数据
                                </Text>
                                <Text
                                    size='2'
                                    style={{ color: 'var(--gray-11)' }}
                                >
                                    自动解析所有工作表，提供表格和 JSON
                                    两种预览模式
                                </Text>
                            </Box>
                            <Box>
                                <Text size='3' weight='medium' mb='1'>
                                    3. 导出数据
                                </Text>
                                <Text
                                    size='2'
                                    style={{ color: 'var(--gray-11)' }}
                                >
                                    可将任意工作表导出为 CSV 或 JSON 格式文件
                                </Text>
                            </Box>
                        </Flex>
                    </Card>
                )}
            </Flex>
        </Box>
    )
}

export default Copy
