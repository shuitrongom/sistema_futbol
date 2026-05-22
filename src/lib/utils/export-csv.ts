/**
 * Exporta datos a un archivo CSV con BOM para compatibilidad con Excel.
 * @param data - Array de objetos a exportar. Las keys del primer objeto se usan como encabezados.
 * @param filename - Nombre del archivo sin extensión.
 */
export function exportToCSV(
  data: Record<string, string | number | boolean | null | undefined>[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(escapeCSVField).join(","));

  // Data rows
  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      return escapeCSVField(String(val));
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");

  // BOM (Byte Order Mark) for Excel UTF-8 compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(filename)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-_]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}
