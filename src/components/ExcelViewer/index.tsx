import { type FC } from 'react'
import {
    Box,
    Text,
    Card,
    Flex,
    Button,
    Badge,
    IconButton,
    ScrollArea,
    Table
} from '@radix-ui/themes'
import {
    FileTextIcon,
    DownloadIcon,
    Cross2Icon,
    CopyIcon,
    CheckIcon
} from '@radix-ui/react-icons'
import type { ExcelFile, ExcelSheet } from '../../hooks/useExcelUpload'
import { useExcelViewer } from '../../hooks/useExcelViewer'

import './index.css'

interface ExcelViewerProps {
    file: ExcelFile
    onClearFile: () => void
}

const ExcelViewer: FC<ExcelViewerProps> = ({ file, onClearFile }) => {
    const {
        getStatusColor,
        getStatusText,
        handleCopyToClipboard,
        handleExportToExcel,
        isSheetCopied,
        isOperating
    } = useExcelViewer(file)

    // 渲染表格预览
    const renderTablePreview = (sheet: ExcelSheet) => {
        const data = sheet.data

        if (data.length === 0) {
            return (
                <Box p='6' style={{ textAlign: 'center' }}>
                    <Text size='3' style={{ color: 'var(--gray-10)' }}>
                        暂无可显示的数据
                    </Text>
                </Box>
            )
        }

        return (
            <ScrollArea style={{ height: '400px' }}>
                <Table.Root>
                    <Table.Body>
                        {data.map((row, rowIndex) => (
                            <Table.Row key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <Table.Cell
                                        key={cellIndex}
                                        style={{ maxWidth: '200px' }}
                                    >
                                        <Text
                                            size='2'
                                            style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'block'
                                            }}
                                        >
                                            {cell || ''}
                                        </Text>
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </ScrollArea>
        )
    }

    if (file.status === 'error') {
        return (
            <Card>
                <Flex align='center' justify='between' mb='4'>
                    <Flex align='center' gap='3'>
                        <FileTextIcon
                            width='20'
                            height='20'
                            style={{ color: 'var(--red-9)' }}
                        />
                        <Text size='4' weight='medium'>
                            文件解析失败
                        </Text>
                        <Badge color='red' variant='soft'>
                            错误
                        </Badge>
                    </Flex>
                    <IconButton
                        variant='soft'
                        color='red'
                        onClick={onClearFile}
                    >
                        <Cross2Icon width='16' height='16' />
                    </IconButton>
                </Flex>

                <Box
                    p='4'
                    style={{
                        background: 'var(--red-2)',
                        borderRadius: '8px',
                        border: '1px solid var(--red-6)'
                    }}
                >
                    <Text
                        size='3'
                        weight='medium'
                        mb='2'
                        style={{ color: 'var(--red-11)' }}
                    >
                        {file.name}
                    </Text>
                    <Text size='2' style={{ color: 'var(--red-10)' }}>
                        错误信息: {file.error || '未知错误'}
                    </Text>
                    <Flex align='center' gap='3' mt='2'>
                        <Text size='2' style={{ color: 'var(--gray-10)' }}>
                            文件大小: {file.size}
                        </Text>
                        <Text size='2' style={{ color: 'var(--gray-10)' }}>
                            上传时间: {file.uploadTime}
                        </Text>
                    </Flex>
                </Box>
            </Card>
        )
    }

    return (
        <Card>
            <Flex align='center' justify='between' mb='4'>
                <Flex align='center' gap='3'>
                    <FileTextIcon
                        width='20'
                        height='20'
                        style={{ color: 'var(--blue-9)' }}
                    />
                    <Text size='4' weight='medium'>
                        Excel 文件详情
                    </Text>
                    <Badge color={getStatusColor(file.status)} variant='soft'>
                        {getStatusText(file.status)}
                    </Badge>
                </Flex>
                <IconButton variant='soft' color='red' onClick={onClearFile}>
                    <Cross2Icon width='16' height='16' />
                </IconButton>
            </Flex>

            {/* 文件信息 */}
            <Box
                p='3'
                mb='4'
                style={{
                    background: 'var(--gray-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--gray-6)'
                }}
            >
                <Text size='3' weight='medium' mb='2'>
                    {file.name}
                </Text>
                <Flex align='center' gap='4' wrap='wrap'>
                    <Text size='2' style={{ color: 'var(--gray-10)' }}>
                        文件大小: {file.size}
                    </Text>
                    <Text size='2' style={{ color: 'var(--gray-10)' }}>
                        工作表数量: {file.sheets.length}
                    </Text>
                    <Text size='2' style={{ color: 'var(--gray-10)' }}>
                        上传时间: {file.uploadTime}
                    </Text>
                </Flex>
            </Box>

            {file.status === 'completed' && file.sheets.length > 0 && (
                <>
                    {file.sheets.map((sheet) => (
                        <Card key={sheet.name} mb='4'>
                            <Flex align='center' justify='between' mb='3'>
                                <Flex align='center' gap='3'>
                                    <Text size='3' weight='medium'>
                                        {sheet.name}
                                    </Text>
                                    <Badge variant='soft'>
                                        {sheet.rowCount} 行 × {sheet.colCount}{' '}
                                        列
                                    </Badge>
                                </Flex>
                                <Flex gap='2'>
                                    <Button
                                        variant='soft'
                                        size='2'
                                        onClick={() =>
                                            handleCopyToClipboard(sheet)
                                        }
                                        disabled={
                                            isSheetCopied(sheet) || isOperating
                                        }
                                        style={{ minWidth: '120px' }}
                                    >
                                        {isSheetCopied(sheet) ? (
                                            <>
                                                <CheckIcon
                                                    width='14'
                                                    height='14'
                                                />
                                                已复制
                                            </>
                                        ) : (
                                            <>
                                                <CopyIcon
                                                    width='14'
                                                    height='14'
                                                />
                                                复制到剪切板
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant='soft'
                                        size='2'
                                        onClick={() =>
                                            handleExportToExcel(sheet)
                                        }
                                        disabled={isOperating}
                                    >
                                        <DownloadIcon width='14' height='14' />
                                        导出 Excel
                                    </Button>
                                </Flex>
                            </Flex>

                            {renderTablePreview(sheet)}
                        </Card>
                    ))}
                </>
            )}

            {file.status === 'processing' && (
                <Box p='6' style={{ textAlign: 'center' }}>
                    <div className='processing-indicator'>
                        <FileTextIcon width='32' height='32' />
                    </div>
                    <Text size='3' weight='medium' mt='3'>
                        正在解析 Excel 文件...
                    </Text>
                    <Text size='2' style={{ color: 'var(--gray-10)' }} mt='1'>
                        请稍候，正在读取工作表数据
                    </Text>
                </Box>
            )}
        </Card>
    )
}

export default ExcelViewer
