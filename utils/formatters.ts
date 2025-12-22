export const formatRut = (rut: string): string => {
  // Eliminar puntos y guiones
  let value = rut.replace(/[.-]/g, '');
  
  if (value.length < 2) return value;

  // Separar cuerpo y dígito verificador
  const body = value.slice(0, -1);
  const dv = value.slice(-1).toUpperCase();

  // Formatear cuerpo con puntos
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      const value = row[fieldName]?.toString() || '';
      return `"${value.replace(/"/g, '""')}"`; // Escape quotes
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};