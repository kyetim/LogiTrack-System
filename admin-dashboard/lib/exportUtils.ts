import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 */
export function exportToExcel<T extends Record<string, any>>(
    data: T[],
    filename: string,
    sheetName: string = 'Sheet1'
) {
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string
) {
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Convert to CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Create blob and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Format data for export by removing unnecessary fields
 */
export function prepareDataForExport<T extends Record<string, any>>(
    data: T[],
    excludeFields: string[] = ['id', 'createdAt', 'updatedAt']
): Partial<T>[] {
    return data.map(item => {
        const cleaned: any = {};
        Object.keys(item).forEach(key => {
            if (!excludeFields.includes(key)) {
                // Handle nested objects
                if (typeof item[key] === 'object' && item[key] !== null && !Array.isArray(item[key])) {
                    // Flatten nested objects
                    Object.keys(item[key]).forEach(nestedKey => {
                        cleaned[`${key}_${nestedKey}`] = item[key][nestedKey];
                    });
                } else {
                    cleaned[key] = item[key];
                }
            }
        });
        return cleaned;
    });
}
