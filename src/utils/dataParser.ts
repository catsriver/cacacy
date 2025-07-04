interface DataItem {
  [key: string]: number;
}

type ParsedRow = (string | number)[];
type ParsedData = ParsedRow[];

/**
 * 解析原始数据并转换为表格格式
 * @param rawData 原始数据数组
 * @returns 解析后的二维数组，适用于表格渲染
 */
export const parseData = (rawData: DataItem[]): ParsedData => {
  // 将每个数据项转换为键值对数组，空键替换为"空白"
  const convertedEntries = rawData.map((dataItem) => {
    return Object.entries(dataItem).map(([key, value]) => [
      key === '' ? '空白' : key,
      value,
    ]);
  });

  // 根据业务逻辑对数据进行分组
  const groupedData = [
    // 第一组：索引 0, 3, 6 的数据，用空列分隔
    [
      ...convertedEntries[0],
      ['', ''],
      ['', ''],
      ...convertedEntries[3],
      ['', ''],
      ['', ''],
      ...convertedEntries[6],
    ],
    // 第二组：索引 1, 2 的数据，用空列分隔
    [...convertedEntries[1], ['', ''], ['', ''], ...convertedEntries[2]],
    // 第三组：索引 4, 5 的数据，用空列分隔
    [...convertedEntries[4], ['', ''], ['', ''], ...convertedEntries[5]],
    // 第四组：索引 7, 8, 9 的数据，用空列分隔
    [
      ...convertedEntries[7],
      ['', ''],
      ['', ''],
      ...convertedEntries[8],
      ['', ''],
      ['', ''],
      ...convertedEntries[9],
    ],
  ];

  return transformToTableFormat(groupedData);
};

/**
 * 对齐数组长度，确保所有子数组具有相同长度
 * @param arrays 需要对齐的数组集合
 * @returns 对齐后的数组集合
 */
const alignArrayLengths = (arrays: ParsedRow[][]): ParsedRow[][] => {
  const maxLength = Math.max(...arrays.map((arr) => arr.length));

  return arrays.map((arr) => {
    const alignedArray = [...arr];
    const paddingCount = maxLength - alignedArray.length;

    // 用空值填充到最大长度
    for (let i = 0; i < paddingCount; i++) {
      alignedArray.push(['', '']);
    }

    return alignedArray;
  });
};

/**
 * 将分组的三维数组转换为适合表格显示的二维数组
 * @param groupedData 分组后的数据
 * @returns 转换后的表格数据
 */
const transformToTableFormat = (groupedData: ParsedRow[][]): ParsedData => {
  // 对齐所有组的长度
  const alignedGroups = alignArrayLengths(groupedData);
  const maxRowCount = alignedGroups[0].length;

  // 初始化结果数组
  const tableData: ParsedData = Array.from({ length: maxRowCount }, () => []);

  // 遍历每个组，将数据按行组织
  alignedGroups.forEach((group, groupIndex) => {
    group.forEach((row, rowIndex) => {
      if (groupIndex > 0) {
        // 非第一组前添加分隔符
        tableData[rowIndex].push('', ...row);
      } else {
        // 第一组直接添加
        tableData[rowIndex].push(...row);
      }
    });
  });

  return tableData;
};
