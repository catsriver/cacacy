import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'

export interface ExcelFile {
    id: string
    file: File
    name: string
    size: string
    uploadTime: string
    status: 'processing' | 'completed' | 'error'
    sheets: ExcelSheet[]
    error?: string
}

export interface ExcelSheet {
    name: string
    data: (string | number | null)[][]
    rowCount: number
    colCount: number
}

export const useExcelUpload = () => {
    const [currentFile, setCurrentFile] = useState<ExcelFile | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const validateFile = (file: File): boolean => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ]
        const maxSize = 50 * 1024 * 1024 // 50MB

        if (
            !allowedTypes.includes(file.type) &&
            !file.name.match(/\.(xlsx|xls)$/i)
        ) {
            alert('不支持的文件格式。请上传 .xlsx 或 .xls 格式的 Excel 文件。')
            return false
        }

        if (file.size > maxSize) {
            alert('文件大小超过限制。请上传小于 50MB 的 Excel 文件。')
            return false
        }

        return true
    }

    const processExcelFile = useCallback(
        async (file: File): Promise<ExcelFile> => {
            return new Promise((resolve) => {
                const reader = new FileReader()

                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(
                            e.target?.result as ArrayBuffer
                        )
                        const workbook = XLSX.read(data, { type: 'array' })

                        const sheets: ExcelSheet[] = workbook.SheetNames.map(
                            (sheetName) => {
                                const worksheet = workbook.Sheets[sheetName]

                                const jsonData = XLSX.utils.sheet_to_json(
                                    worksheet,
                                    {
                                        header: 1,
                                        defval: '',
                                        raw: false
                                    }
                                ) as (string | number | null)[][]

                                return {
                                    name: sheetName,
                                    data: jsonData,
                                    rowCount: jsonData.length,
                                    colCount:
                                        jsonData.length > 0
                                            ? Math.max(
                                                  ...jsonData.map(
                                                      (row) => row.length
                                                  )
                                              )
                                            : 0
                                }
                            }
                        )

                        const excelFile: ExcelFile = {
                            id:
                                Date.now().toString() +
                                Math.random().toString(36).substr(2, 9),
                            file,
                            name: file.name,
                            size: formatFileSize(file.size),
                            uploadTime: new Date().toLocaleString('zh-CN'),
                            status: 'completed',
                            sheets
                        }

                        resolve(excelFile)
                    } catch (error) {
                        const excelFile: ExcelFile = {
                            id:
                                Date.now().toString() +
                                Math.random().toString(36).substr(2, 9),
                            file,
                            name: file.name,
                            size: formatFileSize(file.size),
                            uploadTime: new Date().toLocaleString('zh-CN'),
                            status: 'error',
                            sheets: [],
                            error:
                                error instanceof Error
                                    ? error.message
                                    : '文件解析失败'
                        }
                        resolve(excelFile)
                    }
                }

                reader.onerror = () => {
                    const excelFile: ExcelFile = {
                        id:
                            Date.now().toString() +
                            Math.random().toString(36).substr(2, 9),
                        file,
                        name: file.name,
                        size: formatFileSize(file.size),
                        uploadTime: new Date().toLocaleString('zh-CN'),
                        status: 'error',
                        sheets: [],
                        error: '文件读取失败'
                    }
                    resolve(excelFile)
                }

                reader.readAsArrayBuffer(file)
            })
        },
        []
    )

    const uploadFile = useCallback(
        async (file: File) => {
            if (!validateFile(file)) {
                return
            }

            setIsProcessing(true)

            // 创建初始文件对象
            const initialFile: ExcelFile = {
                id:
                    Date.now().toString() +
                    Math.random().toString(36).substr(2, 9),
                file,
                name: file.name,
                size: formatFileSize(file.size),
                uploadTime: new Date().toLocaleString('zh-CN'),
                status: 'processing',
                sheets: []
            }

            setCurrentFile(initialFile)

            try {
                const processedFile = await processExcelFile(file)
                setCurrentFile(processedFile)
            } catch (error) {
                setCurrentFile((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: 'error',
                              error:
                                  error instanceof Error
                                      ? error.message
                                      : '处理失败'
                          }
                        : null
                )
            } finally {
                setIsProcessing(false)
            }
        },
        [processExcelFile]
    )

    const clearFile = useCallback(() => {
        setCurrentFile(null)
    }, [])

    const exportToCSV = useCallback((sheet: ExcelSheet) => {
        const csvContent = sheet.data
            .map((row) =>
                row
                    .map((cell) => {
                        // 处理包含逗号、引号或换行符的单元格
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

        const blob = new Blob(['\uFEFF' + csvContent], {
            type: 'text/csv;charset=utf-8;'
        })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${sheet.name}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }, [])

    const exportToJSON = useCallback((sheet: ExcelSheet) => {
        if (sheet.data.length === 0) {
            alert('没有可导出的数据')
            return
        }

        const headers = sheet.data[0] || []
        const jsonData = sheet.data.slice(1).map((row) => {
            const obj: Record<string, string | number | null> = {}
            headers.forEach((header, index) => {
                obj[header || `Column${index + 1}`] = row[index] || ''
            })
            return obj
        })

        const jsonContent = JSON.stringify(jsonData, null, 2)
        const blob = new Blob([jsonContent], {
            type: 'application/json;charset=utf-8;'
        })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${sheet.name}.json`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }, [])

    return {
        currentFile,
        isDragging,
        isProcessing,
        setIsDragging,
        uploadFile,
        clearFile,
        exportToCSV,
        exportToJSON
    }
}
