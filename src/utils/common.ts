export const groupByKey = <T>(
  arr: T[],
  generateKey: (item: T) => string
): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const item of arr) {
    const groupKey = generateKey(item);
    if (result[groupKey]) {
      result[groupKey]++;
    } else {
      result[groupKey] = 1;
    }
  }
  return result;
};
