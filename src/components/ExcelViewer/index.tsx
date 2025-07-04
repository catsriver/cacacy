import { useState, useEffect, useMemo, type FC } from 'react'
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
    CheckboxGroup,
    Separator
} from '@radix-ui/themes'
import {
    FileTextIcon,
    DownloadIcon,
    Cross2Icon,
    CopyIcon,
    CheckIcon,
    EyeOpenIcon,
    EyeClosedIcon,
    MixerHorizontalIcon,
    ResetIcon
} from '@radix-ui/react-icons'
import type { ExcelFile, ExcelSheet } from '../../hooks/useExcelUpload'
import { useExcelDataProcessor } from '../../hooks/useExcelDataProcessor'
import { useExcelOperations } from '../../hooks/useExcelOperations'

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
    
    // 筛选状态
    const [selectedLines, setSelectedLines] = useState<string[]>([])
    const [selectedDefects, setSelectedDefects] = useState<string[]>(['脏污', '划伤'])
    const [showFilters, setShowFilters] = useState(false)

    const { sheet2json, filterWith, counteByKey, generateSheetData } = useExcelDataProcessor()
    const { copyToClipboard, exportToExcel, isSheetCopied, isOperating } = useExcelOperations()

    // 获取状态颜色
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'green'
            case 'processing':
                return 'orange'
            case 'error':
                return 'red'
            default:
                return 'gray'
        }
    }

    // 获取状态文本
    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return '解析完成'
            case 'processing':
                return '处理中'
            case 'error':
                return '解析失败'
            default:
                return '未知状态'
        }
    }

    // 从原始数据中提取所有可用的线别和不良项
    const availableOptions = useMemo(() => {
        if (!file || file.status !== 'completed' || !file.sheets.length) {
            return { lines: [], defects: [] }
        }

        const allLines = new Set<string>()
        const allDefects = new Set<string>()

        try {
            file.sheets.forEach((sheet) => {
                if (!sheet.data || sheet.data.length < 3) return

                const jsonData = sheet2json(sheet)
                
                Object.values(jsonData).forEach((records) => {
                    if (!Array.isArray(records)) return
                    
                    records.forEach((record) => {
                        const line = String(record['线别'] || '').trim()
                        const defect = String(record['不良项'] || '').trim()
                        
                        if (line && line !== 'undefined' && line !== 'null') {
                            allLines.add(line)
                        }
                        if (defect && defect !== 'undefined' && defect !== 'null') {
                            allDefects.add(defect)
                        }
                    })
                })
            })
        } catch (error) {
            console.error('提取筛选选项时出错:', error)
        }

        return {
            lines: Array.from(allLines).sort(),
            defects: Array.from(allDefects).sort()
        }
    }, [file, sheet2json])

    // 生成筛选后的预览数据
    const getFilteredPreviewData = useMemo(() => {
        if (!file || file.status !== 'completed' || !file.sheets.length) {
            return []
        }

        const previewData: ExcelSheet[] = []

        try {
            file.sheets.forEach((sheet) => {
                try {
                    if (!sheet.data || sheet.data.length < 3) {
                        console.warn(`工作表 ${sheet.name} 数据不足，跳过处理`)
                        return
                    }

                    // 1.转json
                    const jsonData = sheet2json(sheet)
                    
                    if (!jsonData || Object.keys(jsonData).length === 0) {
                        console.warn(`工作表 ${sheet.name} 无法解析出有效的制程数据`)
                        return
                    }

                    // 2.使用当前选择的筛选条件进行过滤
                    const filtered = filterWith({
                        jsonSheet: jsonData,
                        targetLines: selectedLines.length > 0 ? selectedLines : undefined,
                        targetDefects: selectedDefects.length > 0 ? selectedDefects : undefined
                    })

                    const hasFilteredData = Object.values(filtered).some(
                        records => records && records.length > 0
                    )

                    if (!hasFilteredData) {
                        console.warn(`工作表 ${sheet.name} 过滤后无有效数据`)
                        return
                    }

                    // 3.分组统计
                    const counted = Object.values(filtered)
                        .map((records) =>
                            counteByKey(records, (record) => String(record['设备ID'] || ''))
                        )

                    // 4.转换为表格数据
                    if (counted.length > 0) {
                        const generatedSheet = generateSheetData(counted, sheet.name)
                        if (generatedSheet.data.length > 0) {
                            previewData.push(generatedSheet)
                        }
                    }
                } catch (sheetError) {
                    console.error(`处理工作表 ${sheet.name} 时出错:`, sheetError)
                }
            })
        } catch (error) {
            console.error('获取预览数据失败:', error)
            return []
        }

        return previewData
    }, [file, selectedLines, selectedDefects, sheet2json, filterWith, counteByKey, generateSheetData])

    // 获取当前显示的数据
    const currentDisplayData = previewMode === 'analysis' ? getFilteredPreviewData : file.sheets

    // 当文件变化时重置状态
    useEffect(() => {
        setSelectedSheet(0)
        setSelectedLines([])
        setSelectedDefects(['脏污', '划伤'])
        setShowFilters(false)
    }, [file.id])

    // 当预览模式变化时，确保选中的工作表索引有效
    useEffect(() => {
        if (currentDisplayData.length > 0 && selectedSheet >= currentDisplayData.length) {
            setSelectedSheet(0)
        }
    }, [previewMode, currentDisplayData.length, selectedSheet])

    // 处理复制操作
    const handleCopyToClipboard = async (sheet: ExcelSheet) => {
        try {
            await copyToClipboard(sheet)
        } catch (error) {
            alert(error instanceof Error ? error.message : '复制失败，请重试')
        }
    }

    // 处理导出操作
    const handleExportToExcel = async (sheet: ExcelSheet) => {
        try {
            await exportToExcel(sheet)
        } catch (error) {
            alert(error instanceof Error ? error.message : '导出失败，请重试')
        }
    }

    // 重置筛选条件
    const resetFilters = () => {
        setSelectedLines([])
        setSelectedDefects(['脏污', '划伤'])
    }

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

                    {/* 筛选功能区 - 仅在解析结果模式下显示 */}
                    {previewMode === 'analysis' && (
                        <Card mb='4' style={{ background: 'var(--gray-2)' }}>
                            <Flex align='center' justify='between' mb='3'>
                                <Flex align='center' gap='2'>
                                    <MixerHorizontalIcon width='16' height='16' style={{ color: 'var(--blue-9)' }} />
                                    <Text size='3' weight='medium'>
                                        数据筛选
                                    </Text>
                                    <Badge variant='soft' color='blue'>
                                        {selectedLines.length + selectedDefects.length} 项已选
                                    </Badge>
                                </Flex>
                                <Flex align='center' gap='2'>
                                    <Button
                                        variant='soft'
                                        size='1'
                                        onClick={resetFilters}
                                        disabled={selectedLines.length === 0 && selectedDefects.length === 2}
                                    >
                                        <ResetIcon width='12' height='12' />
                                        重置
                                    </Button>
                                    <Button
                                        variant='soft'
                                        size='1'
                                        onClick={() => setShowFilters(!showFilters)}
                                    >
                                        {showFilters ? '收起' : '展开'}
                                    </Button>
                                </Flex>
                            </Flex>

                            {showFilters && (
                                <>
                                    <Separator size='4' mb='3' />
                                    <Flex direction='column' gap='4'>
                                        {/* 线别筛选 */}
                                        <Box>
                                            <Flex align='center' gap='2' mb='2'>
                                                <Text size='2' weight='medium' style={{ color: 'var(--gray-12)' }}>
                                                    线别筛选
                                                </Text>
                                                <Badge variant='soft' size='1'>
                                                    {availableOptions.lines.length} 个选项
                                                </Badge>
                                                {selectedLines.length > 0 && (
                                                    <Badge variant='soft' color='blue' size='1'>
                                                        已选 {selectedLines.length}
                                                    </Badge>
                                                )}
                                            </Flex>
                                            {availableOptions.lines.length > 0 ? (
                                                <CheckboxGroup.Root
                                                    value={selectedLines}
                                                    onValueChange={setSelectedLines}
                                                >
                                                    <Flex wrap='wrap' gap='2'>
                                                        {availableOptions.lines.map((line) => (
                                                            <CheckboxGroup.Item
                                                                key={line}
                                                                value={line}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                {line}
                                                            </CheckboxGroup.Item>
                                                        ))}
                                                    </Flex>
                                                </CheckboxGroup.Root>
                                            ) : (
                                                <Text size='2' style={{ color: 'var(--gray-10)' }}>
                                                    未找到可用的线别选项
                                                </Text>
                                            )}
                                        </Box>

                                        {/* 不良项筛选 */}
                                        <Box>
                                            <Flex align='center' gap='2' mb='2'>
                                                <Text size='2' weight='medium' style={{ color: 'var(--gray-12)' }}>
                                                    不良项筛选
                                                </Text>
                                                <Badge variant='soft' size='1'>
                                                    {availableOptions.defects.length} 个选项
                                                </Badge>
                                                {selectedDefects.length > 0 && (
                                                    <Badge variant='soft' color='blue' size='1'>
                                                        已选 {selectedDefects.length}
                                                    </Badge>
                                                )}
                                            </Flex>
                                            {availableOptions.defects.length > 0 ? (
                                                <CheckboxGroup.Root
                                                    value={selectedDefects}
                                                    onValueChange={setSelectedDefects}
                                                >
                                                    <Flex wrap='wrap' gap='2'>
                                                        {availableOptions.defects.map((defect) => (
                                                            <CheckboxGroup.Item
                                                                key={defect}
                                                                value={defect}
                                                                style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                {defect}
                                                            </CheckboxGroup.Item>
                                                        ))}
                                                    </Flex>
                                                </CheckboxGroup.Root>
                                            ) : (
                                                <Text size='2' style={{ color: 'var(--gray-10)' }}>
                                                    未找到可用的不良项选项
                                                </Text>
                                            )}
                                        </Box>
                                    </Flex>
                                </>
                            )}
                        </Card>
                    )}

                    {/* 数据状态提示 */}
                    {previewMode === 'analysis' && getFilteredPreviewData.length === 0 && (
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
                                {availableOptions.lines.length === 0 && availableOptions.defects.length === 0 
                                    ? '无法生成解析结果' 
                                    : '当前筛选条件下无数据'
                                }
                            </Text>
                            <Text size='2' style={{ color: 'var(--orange-10)' }}>
                                {availableOptions.lines.length === 0 && availableOptions.defects.length === 0 
                                    ? '当前 Excel 文件的数据格式不符合解析要求，请查看原始表格或检查数据格式'
                                    : '请调整筛选条件或查看原始表格数据'
                                }
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
                                                {previewMode === 'analysis' && (
                                                    <Badge variant='soft' color='green' size='1'>
                                                        已筛选
                                                    </Badge>
                                                )}
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