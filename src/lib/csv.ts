type CsvValue = string | number | null | undefined

export function downloadCsv(filename: string, columns: readonly string[], rows: CsvValue[][]) {
  const records = rows.map(row => row.map(value => {
    let text = String(value ?? '')
    if (typeof value === 'string' && /^[\s]*[=+@-]|^[\t\r\n]/.test(text)) text = "'" + text
    return '"' + text.replaceAll('"', '""') + '"'
  }).join(','))
  const csv = [columns.join(','), ...records].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
