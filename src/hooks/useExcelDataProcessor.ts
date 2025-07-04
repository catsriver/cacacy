import type { ExcelSheet } from './useExcelUpload'

interface ProcessRecord {
    WaferID: string
    线别: string
    不良项: string
    设备ID?: string
    [key: string]: string | number | null | undefined
}

export interface SheetJsonData {
    [process: string]: ProcessRecord[]
}

interface GroupedData {
    [key: string]: number
}

interface FilterWithParams {
    jsonSheet: SheetJsonData
    targetLines?: string[]
    targetDefects?: string[]
}

export const useExcelDataProcessor = () => {
    // 解析 Excel 数据
    const sheet2json = (sheet: ExcelSheet): SheetJsonData => {
        const result: SheetJsonData = {}

        if (!sheet || !sheet.data || sheet.rowCount < 3 || sheet.data.length < 2) {
            console.warn('数据不足，无法解析')
            return result
        }

        const row1 = sheet.data[0] || []
        const row2 = sheet.data[1] || []
        const publicFields = new Set(['WaferID', '不良项', '线别'])
        const excludedFields = new Set(['SE激光', '丝网印刷'])

        const processMap = new Map<
            string,
            { startCol: number; fields: string[] }
        >()

        let waferidIndex = -1
        let lineIndex = -1
        let defectIndex = -1
        let currentProcess: string | null = null

        // 识别制程结构
        for (let col = 0; col < sheet.colCount; col++) {
            const header = String(row1[col] || '').trim()
            const headerField = String(row2[col] || '').trim()

            if (publicFields.has(header)) {
                switch (header) {
                    case 'WaferID':
                        waferidIndex = col
                        break
                    case '线别':
                        lineIndex = col
                        break
                    case '不良项':
                        defectIndex = col
                        break
                }
                currentProcess = null
            } else if (header && !excludedFields.has(header)) {
                if (headerField) {
                    currentProcess = header

                    if (!processMap.has(currentProcess)) {
                        processMap.set(currentProcess, {
                            startCol: col,
                            fields: [headerField]
                        })
                        result[currentProcess] = []
                    }
                }
            } else if (currentProcess && headerField) {
                const processInfo = processMap.get(currentProcess)
                if (processInfo) {
                    processInfo.fields.push(headerField)
                }
            }
        }

        // 检查是否找到了必要的列
        if (waferidIndex === -1 && defectIndex === -1) {
            console.warn('未找到 WaferID 或不良项列')
            return result
        }

        // 处理数据行
        for (let rowIndex = 2; rowIndex < sheet.rowCount; rowIndex++) {
            const row = sheet.data[rowIndex] || []

            const publicRecord: Partial<ProcessRecord> = {
                WaferID: String(row[waferidIndex] ?? '').trim(),
                不良项: String(row[defectIndex] ?? '').trim(),
                线别: String(row[lineIndex] ?? '').trim()
            }

            for (const [process, info] of processMap.entries()) {
                const record: ProcessRecord = {
                    ...publicRecord
                } as ProcessRecord
                
                let hasData = Boolean(publicRecord['WaferID']) || Boolean(publicRecord['不良项'])

                for (let i = 0; i < info.fields.length; i++) {
                    const colIndex = info.startCol + i
                    const field = info.fields[i]
                    const cellValue = row[colIndex]
                    
                    record[field] = cellValue ?? null
                    
                    // 特殊处理设备ID字段
                    if (field.includes('设备') || field.includes('ID') || field === '设备ID') {
                        record['设备ID'] = String(cellValue ?? '').trim()
                    }
                    
                    if (cellValue !== '' && cellValue !== null && cellValue !== undefined) {
                        hasData = true
                    }
                }

                // 如果没有明确的设备ID字段，尝试从其他字段推断
                if (!record['设备ID'] && info.fields.length > 0) {
                    const firstField = info.fields[0]
                    const firstValue = record[firstField]
                    if (firstValue && String(firstValue).trim()) {
                        record['设备ID'] = String(firstValue).trim()
                    }
                }

                if (hasData) {
                    result[process].push(record)
                }
            }
        }

        return result
    }

    /**
     * @param jsonSheet 需要筛选的对象
     * @param targetLines 目标产线
     * @param targetDefects 目标不良
     * @returns 筛选后的对象
     */
    const filterWith = ({
        jsonSheet,
        targetLines = [],
        targetDefects = []
    }: FilterWithParams): SheetJsonData => {
        const filtered: SheetJsonData = {}

        Object.entries(jsonSheet).forEach(([process, records]) => {
            if (!records || !Array.isArray(records)) {
                filtered[process] = []
                return
            }

            // 1.筛选线别
            const filteredByLines =
                targetLines.length > 0
                    ? records.filter((record) =>
                          targetLines.includes(String(record['线别'] || ''))
                      )
                    : records

            // 2.筛选不良项
            const filteredByDefects =
                targetDefects.length > 0
                    ? filteredByLines.filter((record) =>
                          targetDefects.includes(String(record['不良项'] || ''))
                      )
                    : filteredByLines

            filtered[process] = filteredByDefects
        })

        return filtered
    }

    /**
     * 分组统计函数
     * @param arr 需要分组统计的<T>对象数组集合
     * @param generateKey 分组统计依赖的key生成器
     * @returns 分组后的对象
     */
    const counteByKey = <T>(
        arr: T[],
        generateKey: (item: T) => string
    ): GroupedData => {
        const result: GroupedData = {}

        for (const item of arr) {
                const key = generateKey(item)  
                result[key] = (result[key] || 0) + 1
                
            
        }
        
        return result
    }

    /**
     * 统计函数
     * @param array 需要进行分组的三维数组
     * @returns
     */
    const groupArray = (array: (string | number)[][][]) => {
        if (!array || array.length === 0) return []

        if (array.length === 10) {
            return [
                // 第一组：制绒、碱抛、RCA的数据，用空列分隔
                [
                    ...array[0],
                    ['', ''],
                    ['', ''],
                    ...array[3],
                    ['', ''],
                    ['', ''],
                    ...array[6]
                ],
                // 第二组：硼扩、氧化的数据，用空列分隔
                [...array[1], ['', ''], ['', ''], ...array[2]],
                // 第三组：Poly、退火的数据，用空列分隔
                [...array[4], ['', ''], ['', ''], ...array[5]],
                // 第四组：ALD、正膜、背膜的数据，用空列分隔
                [
                    ...array[7],
                    ['', ''],
                    ['', ''],
                    ...array[8],
                    ['', ''],
                    ['', ''],
                    ...array[9]
                ]
            ]
        } else {
            // 排成一排
            return [...array]
        }
    }

    /**
     * 将GroupedData转换为表格格式数据
     * @param array 原始对象数组
     * @returns 生成的ExcelSheet
     */
    const generateSheetData = (
        array: GroupedData[],
        sheetName: string
    ): ExcelSheet => {
        if (!array || array.length === 0) {
            return {
                name: sheetName,
                data: [],
                rowCount: 0,
                colCount: 0
            }
        }

        // 将对象转换为键值对数组
        const convertedEntries = array.map((item) => {
            if (!item || typeof item !== 'object') {
                return []
            }

            // 1.按键升序排序
            const sortedEntries = Object.entries(item).sort((a, b) =>
                a[0].localeCompare(b[0])
            )

            // 2.空键替换为空白
            const replacedEntries = sortedEntries.map(([k, v]) => [
                k || '空白',
                v
            ])

            return replacedEntries
        }).filter(entries => entries.length > 0)

        if (convertedEntries.length === 0) {
            return {
                name: sheetName,
                data: [],
                rowCount: 0,
                colCount: 0
            }
        }

        // 根据业务逻辑对数据进行分组
        const groupedData = groupArray(convertedEntries)

        // 将三维数组转换为适合表格
        const transformedData = transformToTableFormat(groupedData)

        // 生成表头
        if (transformedData.length > 0) {
            const headers = generateHeaders(transformedData[0].length)
            transformedData.unshift(headers)
        }

        const sheet: ExcelSheet = {
            name: sheetName,
            data: transformedData,
            rowCount: transformedData.length,
            colCount: transformedData.length > 0 ? transformedData[0].length : 0
        }

        return sheet
    }

    /**
     * 将三维数组转换为适合表格显示的二维数组
     * @param array 分组后的数据
     * @returns 转换后的表格数据
     */
    const transformToTableFormat = (array: (string | number)[][][]) => {
        if (!array || array.length === 0) return []

        // 对齐所有组的长度
        const alignedGroups = alignArrayLengths(array)
        const maxRowCount =
            alignedGroups.length > 0 ? alignedGroups[0].length : 0

        if (maxRowCount === 0) return []

        // 初始化结果数组
        const tableData: (string | number)[][] = Array.from(
            { length: maxRowCount },
            () => []
        )

        // 遍历每个组，将数据按行组织
        alignedGroups.forEach((group, groupIndex) => {
            group.forEach((row, rowIndex) => {
                if (groupIndex > 0) {
                    // 非第一组前添加分隔符
                    tableData[rowIndex].push('', ...row)
                } else {
                    // 第一组直接添加
                    tableData[rowIndex].push(...row)
                }
            })
        })

        return tableData
    }

    /**
     * 对齐数组长度，确保所有子数组具有相同长度
     * @param arrays 需要对齐的数组集合
     * @returns 对齐后的数组集合
     */
    const alignArrayLengths = (arrays: (string | number)[][][]) => {
        if (!arrays || arrays.length === 0) return []

        const maxLength = Math.max(...arrays.map((arr) => arr.length))

        return arrays.map((arr) => {
            const alignedArray = [...arr]
            const paddingCount = maxLength - alignedArray.length

            // 用空值填充到最大长度
            for (let i = 0; i < paddingCount; i++) {
                alignedArray.push(['', ''])
            }

            return alignedArray
        })
    }

    /**
     * 生成表头
     * @param columnCount 要生成的表头列数
     * @returns 表头数据的一维数组
     */
    const generateHeaders = (columnCount: number): string[] => {
        const headers: string[] = []
        for (let i = 0; i < columnCount; i++) {
            if (i % 3 === 0) {
                headers.push('设备ID')
            } else if (i % 3 === 1) {
                headers.push('数量')
            } else {
                headers.push('')
            }
        }
        return headers
    }

    return {
        sheet2json,
        filterWith,
        counteByKey,
        generateSheetData
    }
}