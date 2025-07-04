import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import type { ExcelSheet } from './useExcelUpload'

export const useExcelOperations = () => {
    const [copiedSheets, setCopiedSheets] = useState<Set<string>>(new Set())
    const [isOperating, setIsOperating] = useState(false)

    // 复制到剪切板
    const copyToClipboard = useCallback(
        async (sheet: ExcelSheet) => {
            if (isOperating) return false

            setIsOperating(true)

            try {
                if (sheet.data.length === 0) {
                    throw new Error('没有可复制的数据')
                }

                // 转换为 CSV 格式
                const csvContent = sheet.data
                    .map((row) =>
                        row
                            .map((cell) => {
                                const cellStr = String(cell || '')
                                if (
                                    cellStr.includes(',') ||
                                    cellStr.includes('"') ||
                                    cellStr.includes('\n')
                                ) {
                                    return `"${cellStr.replace(/"/g, '""')}"`
                                }
                                return cellStr
                            })
                            .join(',')
                    )
                    .join('\n')

                await navigator.clipboard.writeText(csvContent)

                setCopiedSheets((prev) => new Set([...prev, sheet.name]))

                setTimeout(() => {
                    setCopiedSheets((prev) => {
                        const newSet = new Set(prev)
                        newSet.delete(sheet.name)
                        return newSet
                    })
                }, 2000)

                return true
            } catch (error) {
                console.error('复制失败:', error)
                throw error
            } finally {
                setIsOperating(false)
            }
        },
        [isOperating]
    )

    // 导出为 Excel
    const exportToExcel = useCallback(
        async (sheet: ExcelSheet) => {
            if (isOperating) return false

            setIsOperating(true)

            try {
                if (sheet.data.length === 0) {
                    throw new Error('没有可导出的数据')
                }

                // 创建新的工作簿
                const workbook = XLSX.utils.book_new()

                // 将处理后的数据转换为工作表
                const worksheet = XLSX.utils.aoa_to_sheet(sheet.data)

                // 设置列宽
                const colWidths =
                    sheet.data.length > 0
                        ? sheet.data[0].map(() => ({ wch: 15 }))
                        : []
                worksheet['!cols'] = colWidths

                // 添加工作表到工作簿
                XLSX.utils.book_append_sheet(workbook, worksheet, '处理结果')

                // 导出文件
                const fileName = `${
                    sheet.name
                }_处理结果_${new Date().toLocaleDateString('zh-CN')}.xlsx`
                XLSX.writeFile(workbook, fileName)

                return true
            } catch (error) {
                console.error('导出失败:', error)
                throw error
            } finally {
                setIsOperating(false)
            }
        },
        [isOperating]
    )

    // 检查是否已复制
    const isSheetCopied = useCallback(
        (sheet: ExcelSheet) => {
            return copiedSheets.has(sheet.name)
        },
        [copiedSheets]
    )

    return {
        copyToClipboard,
        exportToExcel,
        isSheetCopied,
        isOperating
    }
}
