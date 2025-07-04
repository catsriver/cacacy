import { useState, useEffect, type FC } from 'react'
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

    // 获取当前显示的数据
    const currentDisplayData = previewMode === 'analysis' ? getPreviewData : file.sheets

    // 当文件变化时重置选中的工作表
    useEffect(() => {
        setSelectedSheet(0)
    }, [file.id])

    // 当预览模式变化时，确保选中的工作表索引有效
    useEffect(() => {
        if (currentDisplayData.length > 0 && selectedSheet >= currentDisplayData.length) {
            setSelectedSheet(0)
        }
    }, [previewMode, currentDisplayData.length, selectedSheet])

    // 判断是否为数字
    const isNumber = (value: any): boolean => {
        return !isNaN(value) && !isNaN(parseFloat(value)) && value !== '' && value !== null
    }

    // 判断单元格类型
    const getCellType = (value: any, columnIndex: number): string => {
        const cellValue = String(value ?? '').trim()
        
        // 空值判断
        if (cellValue === '' || cellValue === 'null' || cellValue === 'undefined') {
            return 'empty'
        }
        
        // 根据列索引和内容判断类型
        if (columnIndex % 3 === 0) {
            // 设备ID列
            return 'device-id'
        } else if (columnIndex % 3 === 1) {
            // 数量列
            return 'quantity'
        } else {
            // 分隔列
            return 'separator'
        }
    }

    // 渲染表格预览
    const renderTablePreview = (
        sheet: ExcelSheet,
        mode: 'analysis' | 'original'
    ) => {
        const maxRows = 20 // 限制预览行数
        const maxCols = 10 // 限制预览列数

        if (!sheet || !sheet.data || sheet.data.length === 0) {
            return (
                <Box p='6' style={{ textAlign: 'center' }}>
                    <Text size='3' style={{ color: 'var(--gray-10)' }}>
                        暂无可显示的数据
                    </Text>
                </Box>
            )
        }

        let displayData = sheet.data
        let showRowTruncation = false
        let showColTruncation = false

        // 原始模式需要限制显示行列数
        if (mode === 'original') {
            if (sheet.data.length > maxRows) {
                displayData = sheet.data.slice(0, maxRows)
                showRowTruncation = true
            }
            
            if (sheet.colCount > maxCols) {
                displayData = displayData.map(row => row.slice(0, maxCols))
                showColTruncation = true
            }
        }

        // 确保至少有表头
        if (displayData.length === 0) {
            return (
                <Box p='6' style={{ textAlign: 'center' }}>
                    <Text size='3' style={{ color: 'var(--gray-10)' }}>
                        暂无可显示的数据
                    </Text>
                </Box>
            )
        }

        const headers = displayData[0] || []
        const dataRows = displayData.slice(1)

        return (
            <ScrollArea style={{ maxHeight: '600px' }}>
                <Box className="table-container excel-viewer">
                    <table style={{ width: '100%', tableLayout: 'auto' }}>
                        <thead>
                            <tr>
                                {headers.map((header, index) => (
                                    <th
                                        key={index}
                                        style={{
                                            minWidth: getCellType('', index) === 'separator' ? '4ch' : 
                                                     getCellType('', index) === 'quantity' ? '60px' : '180px',
                                            maxWidth: 'max-content',
                                            textAlign: 'center',
                                            background: '#e3f2fd',
                                            color: 'var(--gray-12)',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            padding: '8px 12px',
                                            border: '1px solid var(--gray-7)',
                                            borderBottom: '1px solid var(--gray-7)'
                                        }}
                                    >
                                        {String(header || `列${index + 1}`)}
                                    </th>
                                ))}
                                {showColTruncation && (
                                    <th
                                        style={{
                                            textAlign: 'center',
                                            padding: '8px 12px',
                                            background: '#fff3cd',
                                            color: 'var(--orange-12)',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            border: '1px solid var(--gray-7)'
                                        }}
                                    >
                                        +{sheet.colCount - maxCols}列
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {dataRows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => {
                                        const cellValue = String(cell ?? '').trim()
                                        const cellType = getCellType(cell, cellIndex)
                                        
                                        // 根据单元格类型设置样式
                                        let cellStyle: React.CSSProperties = {
                                            padding: '8px 12px',
                                            border: '1px solid var(--gray-7)',
                                            fontSize: '13px',
                                            verticalAlign: 'middle',
                                            whiteSpace: 'nowrap'
                                        }

                                        let cellClass = ''
                                        
                                        switch (cellType) {
                                            case 'device-id':
                                                cellStyle = {
                                                    ...cellStyle,
                                                    textAlign: 'left',
                                                    paddingLeft: '16px',
                                                    minWidth: '180px',
                                                    maxWidth: 'max-content',
                                                    fontWeight: '500',
                                                    background: 'var(--gray-1)'
                                                }
                                                cellClass = 'device-id-cell'
                                                break
                                            case 'quantity':
                                                cellStyle = {
                                                    ...cellStyle,
                                                    textAlign: 'center',
                                                    minWidth: '60px',
                                                    maxWidth: 'max-content',
                                                    fontWeight: '600',
                                                    background: '#e8f5e8',
                                                    color: 'var(--gray-12)'
                                                }
                                                cellClass = 'quantity-cell'
                                                break
                                            case 'separator':
                                                cellStyle = {
                                                    ...cellStyle,
                                                    minWidth: '4ch',
                                                    maxWidth: '4ch',
                                                    padding: '8px 4px',
                                                    background: 'var(--gray-3)',
                                                    borderLeft: '1px solid var(--gray-7)',
                                                    borderRight: '1px solid var(--gray-7)'
                                                }
                                                cellClass = 'separator-cell'
                                                break
                                            case 'empty':
                                                cellStyle = {
                                                    ...cellStyle,
                                                    background: 'var(--gray-2)',
                                                    color: 'var(--gray-9)',
                                                    fontStyle: 'italic',
                                                    minWidth: '4ch',
                                                    maxWidth: 'max-content'
                                                }
                                                cellClass = 'empty-cell'
                                                break
                                        }
                                        
                                        return (
                                            <td
                                                key={cellIndex}
                                                className={cellClass}
                                                style={cellStyle}
                                            >
                                                {cellType === 'empty' ? '空' : cellValue || ''}
                                            </td>
                                        )
                                    })}
                                    {showColTruncation && (
                                        <td
                                            style={{
                                                textAlign: 'center',
                                                padding: '8px 12px',
                                                border: '1px solid var(--gray-7)',
                                                background: '#fff3cd',
                                                fontSize: '13px'
                                            }}
                                        >
                                            ...
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>

                {showRowTruncation && (
                    <Box
                        className="truncation-notice"
                        p='3'
                        style={{
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, var(--orange-2) 0%, var(--orange-3) 100%)',
                            borderTop: '1px solid var(--orange-6)',
                            borderRadius: '0 0 6px 6px'
                        }}
                    >
                        <Text 
                            size='2' 
                            weight="medium"
                            style={{ color: 'var(--orange-11)' }}
                        >
                            还有 {sheet.rowCount - maxRows} 行数据未显示
                        </Text>
                    </Box>
                )}
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

    if (file.status === 'processing') {
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
                    {/* 预览模式切换 */}
                    <Flex align='center' justify='between' mb='3'>
                        <Text size='3' weight='medium'>
                            数据预览
                        </Text>
                        <Flex align='center' gap='2'>
                            <Button
                                variant={
                                    previewMode === 'analysis'
                                        ? 'solid'
                                        : 'soft'
                                }
                                size='2'
                                onClick={() => setPreviewMode('analysis')}
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
                                size='2'
                                onClick={() => setPreviewMode('original')}
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

                    {/* 数据状态提示 */}
                    {previewMode === 'analysis' && getPreviewData.length === 0 && (
                        <Box
                            p='4'
                            mb='4'
                            style={{
                                background: 'var(--orange-2)',
                                borderRadius: '8px',
                                border: '1px solid var(--orange-6)',
                                textAlign: 'center'
                            }}
                        >
                            <Text size='3' weight='medium' mb='2' style={{ color: 'var(--orange-11)' }}>
                                无法生成解析结果
                            </Text>
                            <Text size='2' style={{ color: 'var(--orange-10)' }}>
                                当前 Excel 文件的数据格式不符合解析要求，请查看原始表格或检查数据格式
                            </Text>
                        </Box>
                    )}

                    {/* 工作表选项卡 */}
                    {currentDisplayData.length > 0 && (
                        <Tabs.Root
                            value={selectedSheet.toString()}
                            onValueChange={(value) =>
                                setSelectedSheet(parseInt(value))
                            }
                        >
                            <Tabs.List>
                                {currentDisplayData.map((sheet, index) => (
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

                            {currentDisplayData.map((sheet, index) => (
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
                    )}
                </>
            )}
        </Card>
    )
}

export default ExcelViewer