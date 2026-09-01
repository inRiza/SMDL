export function formatFileSizeString(fileSizeBytes: number) {
    if (fileSizeBytes < 1024) {
        return `${fileSizeBytes} B`
    }
    if (fileSizeBytes < 1024 * 1024) {
        return `${(fileSizeBytes / 1024).toFixed(2)} KB`
    }
    if (fileSizeBytes < 1024 * 1024 * 1024) {
        return `${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB`
    }
    if (fileSizeBytes < 1024 * 1024 * 1024 * 1024) {
        return `${(fileSizeBytes / 1024 / 1024 / 1024).toFixed(2)} GB`
    }
    return `${(fileSizeBytes / 1024 / 1024 / 1024 / 1024).toFixed(2)} TB`
}