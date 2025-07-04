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
        if (!file || file.status !== 'completed') return []

        const targetDefects = ['脏污', '划伤']
        // const targetLines = []

        const previewData: ExcelSheet[] = []

        try {
            file.sheets.forEach((sheet) => {
                try {
                    // 1.转json
                    const jsonData = sheet2json(sheet)

                    // 2.过滤
                    const filtered = filterWith({
                        jsonSheet: jsonData,
                        targetDefects
                    })

                    // 3.分组统计
                    const counted = Object.values(filtered).map((item) =>
                        counteByKey(item, (key) => String(key['设备ID'] || ''))
                    )

                    // 4.转换为表格数据
                    if (counted.length > 0) {
                        previewData.push(generateSheetData(counted, sheet.name))
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
        handleCopyToClipboard,
        handleExportToExcel,
        isSheetCopied,
        isOperating,
        getPreviewData
    }
}
