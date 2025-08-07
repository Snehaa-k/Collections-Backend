const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

const exportToCsv = async (data, filename = 'export') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Simple CSV generation without file system
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.map(h => h.toUpperCase().replace('_', ' ')).join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

const exportToExcel = async (data, filename = 'export') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

  // Add headers
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers.map(h => h.toUpperCase().replace('_', ' ')));

  // Add data
  data.forEach(row => {
    worksheet.addRow(Object.values(row));
  });

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });

  return await workbook.xlsx.writeBuffer();
};

module.exports = {
  exportToCsv,
  exportToExcel
};