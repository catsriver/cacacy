import { useState, type FC } from 'react'
import {
    Box,
    Text,
    Card,
    Flex,
    Button,
    Badge,
    IconButton,
    ScrollArea,
    Table,
    Tabs
} from '@radix-ui/themes'
import {
    FileTextIcon,
    DownloadIcon,
    Cross2Icon,
    CopyIcon,
    CheckIcon,
    EyeOpenIcon,
    EyeClosedIcon
} from '@radix-ui/react-icons'
import type { ExcelFile, ExcelSheet } from '../../hooks/useExcelUpload'
import { useExcelViewer } from '../../hooks/useExcelViewer'

import './index.css'

interface ExcelViewerProps {
    file: ExcelFile
    onClearFile: () => void
}

const ExcelViewer: FC<ExcelViewerProps> = ({ file, onClearFile }) => {
    const [selectedSheet, setSelectedSheet] = useState(0)
    const [previewMode, setPreviewMode] = useState<'analysis' | 'original'>(
        'analysis'
    )

    const {
        getStatusColor,
        getStatusText,
        getPreviewData,
        handleCopyToClipboard,
        handleExportToExcel,
        isSheetCopied,
        isOperating
    } = useExcelViewer(file)

    const [previewData, setPreviewData] = useState<ExcelSheet[]>(getPreviewData)

    // 渲染表格预览
    const renderTablePreview = (
        sheet: ExcelSheet,
        previewMode: 'analysis' | 'original'
    ) => {
        const maxRows = 20 // 限制预览行数
        const maxCols = 10 // 限制预览列数
        let previewData

        if (sheet.data.length === 0) {
            return (
                <Box p='6' style={{ textAlign: 'center' }}>
                    <Text size='3' style={{ color: 'var(--gray-10)' }}>
                        暂无可显示的数据
                    </Text>
                </Box>
            )
        }

        // 分析模式
        if (previewMode === 'analysis') {
            previewData = sheet.data

            return (
                <ScrollArea style={{ maxHeight: '600px' }}>
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                {previewData[0].map((header, index) => (
                                    <Table.ColumnHeaderCell
                                        key={index}
                                        style={{ minWidth: '20px' }}
                                    >
                                        {header}
                                    </Table.ColumnHeaderCell>
                                ))}
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {previewData.slice(1).map((row, rowIndex) => (
                                <Table.Row key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <Table.Cell key={cellIndex}>
                                            <Text size='2'>{cell}</Text>
                                        </Table.Cell>
                                    ))}
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </ScrollArea>
            )
        }

        // 原始模式
        if (previewMode === 'original') {
            previewData = sheet.data.slice(0, maxRows)

            return (
                <ScrollArea style={{ maxHeight: '600px' }}>
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                {previewData[0]
                                    .slice(0, maxCols)
                                    .map((header, index) => (
                                        <Table.ColumnHeaderCell
                                            key={index}
                                            style={{ minWidth: '120px' }}
                                        >
                                            {header}
                                        </Table.ColumnHeaderCell>
                                    ))}

                                {sheet.colCount > maxCols && (
                                    <Table.ColumnHeaderCell>
                                        <Text
                                            size='2'
                                            style={{ color: 'var(--gray-10)' }}
                                        >
                                            ...还有 {sheet.colCount - maxCols}{' '}
                                            列
                                        </Text>
                                    </Table.ColumnHeaderCell>
                                )}
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {previewData.slice(1).map((row, rowIndex) => (
                                <Table.Row key={rowIndex}>
                                    {row
                                        .slice(0, maxRows)
                                        .map((cell, cellIndex) => (
                                            <Table.Cell
                                                key={cellIndex}
                                                style={{ maxWidth: '200px' }}
                                            >
                                                <Text size='2'>{cell}</Text>
                                            </Table.Cell>
                                        ))}

                                    {sheet.rowCount > maxRows && (
                                        <Table.Cell>
                                            <Text
                                                size='2'
                                                style={{
                                                    color: 'var(--gray-10)'
                                                }}
                                            >
                                                ...
                                            </Text>
                                        </Table.Cell>
                                    )}
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>

                    {sheet.rowCount > maxRows && (
                        <Box
                            p='3'
                            style={{
                                textAlign: 'center',
                                background: 'var(--gray-2)'
                            }}
                        >
                            <Text size='2' style={{ color: 'var(--gray-10)' }}>
                                ...还有 {sheet.rowCount - maxRows} 行数据
                            </Text>
                        </Box>
                    )}
                </ScrollArea>
            )
        }
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
                    {/* 工作表选项卡 */}
                    <Tabs.Root
                        value={selectedSheet.toString()}
                        onValueChange={(value) =>
                            setSelectedSheet(parseInt(value))
                        }
                    >
                        <Flex align='center' justify='between' mb='3'>
                            <Tabs.List>
                                {previewData.map((sheet, index) => (
                                    <Tabs.Trigger
                                        key={index}
                                        value={index.toString()}
                                    >
                                        <Flex align='center' gap='2'>
                                            <Text size='2'>{sheet.name}</Text>
                                            <Badge variant='soft' size='1'>
                                                {sheet.rowCount}行
                                            </Badge>
                                        </Flex>
                                    </Tabs.Trigger>
                                ))}
                            </Tabs.List>

                            <Flex align='center' gap='2'>
                                <Button
                                    variant={
                                        previewMode === 'analysis'
                                            ? 'solid'
                                            : 'soft'
                                    }
                                    size='1'
                                    onClick={() => {
                                        setPreviewMode('analysis')
                                        setPreviewData(getPreviewData)
                                    }}
                                >
                                    {previewMode === 'analysis' ? (
                                        <EyeOpenIcon width='14' height='14' />
                                    ) : (
                                        <EyeClosedIcon width='14' height='14' />
                                    )}
                                    解析结果
                                </Button>
                                <Button
                                    variant={
                                        previewMode === 'original'
                                            ? 'solid'
                                            : 'soft'
                                    }
                                    size='1'
                                    onClick={() => {
                                        setPreviewMode('original')
                                        setPreviewData(file.sheets)
                                    }}
                                >
                                    {previewMode === 'original' ? (
                                        <EyeOpenIcon width='14' height='14' />
                                    ) : (
                                        <EyeClosedIcon width='14' height='14' />
                                    )}
                                    原始表格
                                </Button>
                            </Flex>
                        </Flex>

                        {previewData.map((sheet, index) => (
                            <Tabs.Content key={index} value={index.toString()}>
                                <Card mb='4'>
                                    <Flex
                                        align='center'
                                        justify='between'
                                        mb='3'
                                    >
                                        <Flex align='center' gap='3'>
                                            <Text size='3' weight='bold'>
                                                {sheet.name}
                                            </Text>
                                            <Badge variant='soft'>
                                                {sheet.rowCount}行 x{' '}
                                                {sheet.colCount}列
                                            </Badge>
                                        </Flex>

                                        {previewMode === 'analysis' &&
                                            sheet.data.length > 0 && (
                                                <Flex align='center' gap='3'>
                                                    <Button
                                                        variant='soft'
                                                        size='2'
                                                        disabled={
                                                            isSheetCopied(
                                                                sheet
                                                            ) || isOperating
                                                        }
                                                        onClick={() =>
                                                            handleCopyToClipboard(
                                                                sheet
                                                            )
                                                        }
                                                    >
                                                        {isSheetCopied(
                                                            sheet
                                                        ) ? (
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
                                                        disabled={isOperating}
                                                        onClick={() =>
                                                            handleExportToExcel(
                                                                sheet
                                                            )
                                                        }
                                                    >
                                                        <DownloadIcon
                                                            width='14'
                                                            height='14'
                                                        />
                                                        导出Excel
                                                    </Button>
                                                </Flex>
                                            )}
                                    </Flex>

                                    {/* 渲染表格数据 */}
                                    {renderTablePreview(sheet, previewMode)}
                                </Card>
                            </Tabs.Content>
                        ))}
                    </Tabs.Root>
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
