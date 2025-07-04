import { useMemo } from 'react'
import type { ExcelFile, ExcelSheet } from './useExcelUpload'
import { useExcelDataProcessor } from './useExcelDataProcessor'
import { useExcelOperations } from './useExcelOperations'

export const useExcelViewer = (file: ExcelFile | null) => {
    const { sheet2json, filterWith, counteByKey, generateSheetData } =
        useExcelDataProcessor()
    const { copyToClipboard, exportToExcel, isSheetCopied, isOperating } =
        useExcelOperations()

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

    // 生成预览数据
    const getPreviewData = useMemo(() => {
        if (!file || file.status !== 'completed' || !file.sheets.length) {
            return []
        }

        const targetDefects = ['脏污', '划伤']
        const targetLines = []
        const previewData: ExcelSheet[] = []

        try {
            file.sheets.forEach((sheet) => {
                try {
                    // 检查工作表是否有有效数据
                    if (!sheet.data || sheet.data.length < 3) {
                        console.warn(`工作表 ${sheet.name} 数据不足，跳过处理`)
                        return
                    }

                    // 1.转json
                    const jsonData = sheet2json(sheet)
                    
                    // 检查是否成功解析出数据
                    if (!jsonData || Object.keys(jsonData).length === 0) {
                        console.warn(`工作表 ${sheet.name} 无法解析出有效的制程数据`)
                        return
                    }

                    // 2.过滤
                    const filtered = filterWith({
                        jsonSheet: jsonData,
                        targetDefects
                    })

                    // 检查过滤后是否还有数据
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

                    console.log(counted)

                    // 4.转换为表格数据
                    if (counted.length > 0) {
                        const generatedSheet = generateSheetData(counted, sheet.name)
                        if (generatedSheet.data.length > 0) {
                            previewData.push(generatedSheet)
                        }
                    }
                } catch (sheetError) {
                    console.error(
                        `处理工作表 ${sheet.name} 时出错:`,
                        sheetError
                    )
                    // 继续处理其他工作表
                }
            })
        } catch (error) {
            console.error('获取预览数据失败:', error)
            return []
        }

        return previewData
    }, [file, counteByKey, filterWith, generateSheetData, sheet2json])

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

    return {
        getStatusColor,
        getStatusText,
        getPreviewData,
        handleCopyToClipboard,
        handleExportToExcel,
        isSheetCopied,
        isOperating
    }
}