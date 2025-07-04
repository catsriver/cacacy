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
    Tabs,
  CheckboxGroup
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
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                {headers.map((header, index) => (
                                    <Table.ColumnHeaderCell
                                        key={index}
                                        style={{ 
                                            minWidth: '2ch',
                                            maxWidth: 'fit-content',
                                            textAlign: 'center',
                                            padding: '12px 16px',
                                            background: 'linear-gradient(135deg, var(--blue-4) 0%, var(--blue-5) 100%)',
                                            color: 'var(--blue-12)',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            border: '1px solid var(--gray-6)',
                                            borderBottom: '2px solid var(--blue-7)'
                                        }}
                                    >
                                        <Text size="2" weight="bold">
                                            {String(header || `列${index + 1}`)}
                                        </Text>
                                    </Table.ColumnHeaderCell>
                                ))}
                                {showColTruncation && (
                                    <Table.ColumnHeaderCell
                                        style={{
                                            textAlign: 'center',
                                            padding: '12px 16px',
                                            background: 'linear-gradient(135deg, var(--orange-4) 0%, var(--orange-5) 100%)',
                                            color: 'var(--orange-12)',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            border: '1px solid var(--gray-6)'
                                        }}
                                    >
                                        <Text
                                            size='2'
                                            weight="bold"
                                            style={{ color: 'var(--orange-12)' }}
                                        >
                                            +{sheet.colCount - maxCols}列
                                        </Text>
                                    </Table.ColumnHeaderCell>
                                )}
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {dataRows.map((row, rowIndex) => (
                                <Table.Row key={rowIndex}>
                                    {row.map((cell, cellIndex) => {
                                        const cellValue = String(cell ?? '')
                                        const isEmpty = cellValue === '' || cellValue === 'null' || cellValue === 'undefined'
                                        const isNumeric = isNumber(cell)
                                        
                                        return (
                                            <Table.Cell
                                                key={cellIndex}
                                                className={`${isEmpty ? 'empty-cell' : ''} ${isNumeric ? 'number-cell' : ''}`}
                                                style={{ 
                                                    minWidth: '2ch',
                                                    maxWidth: 'fit-content',
                                                    textAlign: isNumeric ? 'right' : 'center',
                                                    padding: '8px 12px',
                                                    border: '1px solid var(--gray-6)',
                                                    fontSize: '12px',
                                                    verticalAlign: 'middle',
                                                    wordWrap: 'break-word',
                                                    background: isEmpty ? 'var(--gray-3)' : 
                                                               rowIndex % 2 === 0 ? 'var(--gray-1)' : 'var(--gray-2)'
                                                }}
                                            >
                                                <Text 
                                                    size='2'
                                                    style={{
                                                        color: isEmpty ? 'var(--gray-9)' : 'var(--gray-12)',
                                                        fontStyle: isEmpty ? 'italic' : 'normal',
                                                        fontFamily: isNumeric ? "'Monaco', 'Menlo', 'Ubuntu Mono', monospace" : 'inherit',
                                                        fontWeight: isNumeric ? '500' : 'normal'
                                                    }}
                                                >
                                                    {isEmpty ? '空' : cellValue}
                                                </Text>
                                            </Table.Cell>
                                        )
                                    })}
                                    {showColTruncation && (
                                        <Table.Cell
                                            style={{
                                                textAlign: 'center',
                                                padding: '8px 12px',
                                                border: '1px solid var(--gray-6)',
                                                background: 'var(--orange-2)',
                                                fontSize: '12px'
                                            }}
                                        >
                                            <Text
                                                size='2'
                                                style={{ color: 'var(--orange-10)' }}
                                            >
                                                ...
                                            </Text>
                                        </Table.Cell>
                                    )}
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>

                {showRowTruncation && (
                    <Box
                        className="truncation-notice"
                        p='3'
                        style={{
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, var(--orange-2) 0%, var(--orange-3) 100%)',
                            borderTop: '1px solid var(--orange-6)',
                            borderRadius: '0 0 8px 8px'
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

                                      {/* 筛选功能区 */}
                                      <Flex>
                                        <Flex>
                                          <Text>线别</Text>
                                          <CheckboxGroup.Root
                                                defaultValue={['1']}
                                                name='example'
                                            >
                                                <CheckboxGroup.Item value='1'>
                                                 占位符
                                                </CheckboxGroup.Item>
                                                <CheckboxGroup.Item value='3'>
                                                 占位符
                                                </CheckboxGroup.Item>
                                            </CheckboxGroup.Root>
                                          </Flex>
                                        <Flex>
                                          <Text>不良项</Text>
                                           <CheckboxGroup.Root
                                                defaultValue={['1']}
                                                name='example'
                                            >
                                                <CheckboxGroup.Item value='1'>
                                                    占位符
                                                </CheckboxGroup.Item>
                                                <CheckboxGroup.Item value='3'>
                                                   占位符
                                                </CheckboxGroup.Item>
                                            </CheckboxGroup.Root>
                                        </Flex>
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