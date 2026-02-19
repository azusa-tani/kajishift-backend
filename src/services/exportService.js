/**
 * レポートエクスポートサービス
 */

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const adminService = require('./adminService');

/**
 * CSVファイルを生成（メモリ内）
 * @param {Array} data - データ配列
 * @param {Array} headers - ヘッダー配列 [{id: 'field', title: '表示名'}]
 * @returns {Promise<Buffer>} CSVファイルのバッファ
 */
const generateCSV = async (data, headers) => {
  const csvWriter = createCsvWriter({
    header: headers,
    encoding: 'utf8'
  });

  // 一時ファイルではなく、メモリ内で処理
  const records = data.map(item => {
    const record = {};
    headers.forEach(header => {
      record[header.id] = item[header.id] || '';
    });
    return record;
  });

  // CSV文字列を生成
  let csvContent = headers.map(h => h.title).join(',') + '\n';
  records.forEach(record => {
    const row = headers.map(header => {
      const value = record[header.id];
      // カンマや改行を含む場合はダブルクォートで囲む
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvContent += row.join(',') + '\n';
  });

  return Buffer.from(csvContent, 'utf8');
};

/**
 * Excelファイルを生成（メモリ内）
 * @param {Array} data - データ配列
 * @param {Array} headers - ヘッダー配列 [{id: 'field', title: '表示名'}]
 * @param {string} sheetName - シート名
 * @returns {Promise<Buffer>} Excelファイルのバッファ
 */
const generateExcel = async (data, headers, sheetName = 'Sheet1') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // ヘッダー行を追加
  worksheet.columns = headers.map(header => ({
    header: header.title,
    key: header.id,
    width: 15
  }));

  // データ行を追加
  data.forEach(item => {
    const row = {};
    headers.forEach(header => {
      row[header.id] = item[header.id] || '';
    });
    worksheet.addRow(row);
  });

  // ヘッダー行のスタイル設定
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // バッファに変換
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * 予約レポートをCSV形式でエクスポート
 * @param {object} filters - フィルター（startDate, endDate）
 * @returns {Promise<Buffer>} CSVファイルのバッファ
 */
const exportBookingReportCSV = async (filters = {}) => {
  const report = await adminService.getBookingReport(filters);

  // サマリーデータ
  const summaryData = [
    { field: '総予約数', value: report.summary.total },
    { field: '保留中', value: report.summary.pending },
    { field: '確定', value: report.summary.confirmed },
    { field: '進行中', value: report.summary.inProgress },
    { field: '完了', value: report.summary.completed },
    { field: 'キャンセル', value: report.summary.cancelled }
  ];

  // 日付別データ
  const dateData = report.byDate.map(item => ({
    date: item.date,
    count: item.count
  }));

  // サービスタイプ別データ
  const serviceTypeData = Object.entries(report.byServiceType || {}).map(([type, count]) => ({
    serviceType: type,
    count: count
  }));

  // CSVヘッダー
  const headers = [
    { id: 'field', title: '項目' },
    { id: 'value', title: '値' }
  ];

  // サマリー、日付別、サービスタイプ別を結合
  let csvContent = '=== サマリー ===\n';
  csvContent += headers.map(h => h.title).join(',') + '\n';
  summaryData.forEach(item => {
    csvContent += `${item.field},${item.value}\n`;
  });

  csvContent += '\n=== 日付別 ===\n';
  csvContent += '日付,件数\n';
  dateData.forEach(item => {
    csvContent += `${item.date},${item.count}\n`;
  });

  csvContent += '\n=== サービスタイプ別 ===\n';
  csvContent += 'サービスタイプ,件数\n';
  serviceTypeData.forEach(item => {
    csvContent += `${item.serviceType},${item.count}\n`;
  });

  return Buffer.from(csvContent, 'utf8');
};

/**
 * 予約レポートをExcel形式でエクスポート
 * @param {object} filters - フィルター（startDate, endDate）
 * @returns {Promise<Buffer>} Excelファイルのバッファ
 */
const exportBookingReportExcel = async (filters = {}) => {
  const report = await adminService.getBookingReport(filters);

  const workbook = new ExcelJS.Workbook();
  
  // サマリーシート
  const summarySheet = workbook.addWorksheet('サマリー');
  summarySheet.columns = [
    { header: '項目', key: 'field', width: 20 },
    { header: '値', key: 'value', width: 15 }
  ];
  summarySheet.addRow({ field: '総予約数', value: report.summary.total });
  summarySheet.addRow({ field: '保留中', value: report.summary.pending });
  summarySheet.addRow({ field: '確定', value: report.summary.confirmed });
  summarySheet.addRow({ field: '進行中', value: report.summary.inProgress });
  summarySheet.addRow({ field: '完了', value: report.summary.completed });
  summarySheet.addRow({ field: 'キャンセル', value: report.summary.cancelled });
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 日付別シート
  const dateSheet = workbook.addWorksheet('日付別');
  dateSheet.columns = [
    { header: '日付', key: 'date', width: 15 },
    { header: '件数', key: 'count', width: 15 }
  ];
  report.byDate.forEach(item => {
    dateSheet.addRow({ date: item.date, count: item.count });
  });
  dateSheet.getRow(1).font = { bold: true };
  dateSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // サービスタイプ別シート
  const serviceTypeSheet = workbook.addWorksheet('サービスタイプ別');
  serviceTypeSheet.columns = [
    { header: 'サービスタイプ', key: 'serviceType', width: 20 },
    { header: '件数', key: 'count', width: 15 }
  ];
  Object.entries(report.byServiceType || {}).forEach(([type, count]) => {
    serviceTypeSheet.addRow({ serviceType: type, count: count });
  });
  serviceTypeSheet.getRow(1).font = { bold: true };
  serviceTypeSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * 売上レポートをCSV形式でエクスポート
 * @param {object} filters - フィルター（startDate, endDate）
 * @returns {Promise<Buffer>} CSVファイルのバッファ
 */
const exportRevenueReportCSV = async (filters = {}) => {
  const report = await adminService.getRevenueReport(filters);

  let csvContent = '=== サマリー ===\n';
  csvContent += '項目,値\n';
  csvContent += `総売上,${report.summary.totalRevenue}\n`;
  csvContent += `総予約数,${report.summary.totalBookings}\n`;
  csvContent += `平均売上,${report.summary.averageRevenue}\n`;
  csvContent += `完了決済数,${report.summary.completedPayments}\n`;

  csvContent += '\n=== 日付別 ===\n';
  csvContent += '日付,売上\n';
  report.byDate.forEach(item => {
    csvContent += `${item.date},${item.revenue}\n`;
  });

  csvContent += '\n=== サービスタイプ別 ===\n';
  csvContent += 'サービスタイプ,売上\n';
  Object.entries(report.byServiceType || {}).forEach(([type, revenue]) => {
    csvContent += `${type},${revenue}\n`;
  });

  return Buffer.from(csvContent, 'utf8');
};

/**
 * 売上レポートをExcel形式でエクスポート
 * @param {object} filters - フィルター（startDate, endDate）
 * @returns {Promise<Buffer>} Excelファイルのバッファ
 */
const exportRevenueReportExcel = async (filters = {}) => {
  const report = await adminService.getRevenueReport(filters);

  const workbook = new ExcelJS.Workbook();
  
  // サマリーシート
  const summarySheet = workbook.addWorksheet('サマリー');
  summarySheet.columns = [
    { header: '項目', key: 'field', width: 20 },
    { header: '値', key: 'value', width: 20 }
  ];
  summarySheet.addRow({ field: '総売上', value: report.summary.totalRevenue });
  summarySheet.addRow({ field: '総予約数', value: report.summary.totalBookings });
  summarySheet.addRow({ field: '平均売上', value: report.summary.averageRevenue });
  summarySheet.addRow({ field: '完了決済数', value: report.summary.completedPayments });
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 日付別シート
  const dateSheet = workbook.addWorksheet('日付別');
  dateSheet.columns = [
    { header: '日付', key: 'date', width: 15 },
    { header: '売上', key: 'revenue', width: 20 }
  ];
  report.byDate.forEach(item => {
    dateSheet.addRow({ date: item.date, revenue: item.revenue });
  });
  dateSheet.getRow(1).font = { bold: true };
  dateSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // サービスタイプ別シート
  const serviceTypeSheet = workbook.addWorksheet('サービスタイプ別');
  serviceTypeSheet.columns = [
    { header: 'サービスタイプ', key: 'serviceType', width: 20 },
    { header: '売上', key: 'revenue', width: 20 }
  ];
  Object.entries(report.byServiceType || {}).forEach(([type, revenue]) => {
    serviceTypeSheet.addRow({ serviceType: type, revenue: revenue });
  });
  serviceTypeSheet.getRow(1).font = { bold: true };
  serviceTypeSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * ユーザー統計レポートをCSV形式でエクスポート
 * @param {object} filters - フィルター（startDate, endDate）
 * @returns {Promise<Buffer>} CSVファイルのバッファ
 */
const exportUserReportCSV = async (filters = {}) => {
  const report = await adminService.getUserReport(filters);

  let csvContent = '=== サマリー ===\n';
  csvContent += '項目,値\n';
  csvContent += `総ユーザー数,${report.summary.total}\n`;
  csvContent += `顧客数,${report.summary.customers}\n`;
  csvContent += `ワーカー数,${report.summary.workers}\n`;
  csvContent += `管理者数,${report.summary.admins}\n`;
  csvContent += `アクティブ,${report.summary.active}\n`;
  csvContent += `非アクティブ,${report.summary.inactive}\n`;
  csvContent += `停止中,${report.summary.suspended}\n`;

  csvContent += '\n=== 日付別 ===\n';
  csvContent += '日付,ユーザー数\n';
  report.byDate.forEach(item => {
    csvContent += `${item.date},${item.count}\n`;
  });

  if (report.byMonth && report.byMonth.length > 0) {
    csvContent += '\n=== 月別 ===\n';
    csvContent += '月,ユーザー数\n';
    report.byMonth.forEach(item => {
      csvContent += `${item.month},${item.count}\n`;
    });
  }

  return Buffer.from(csvContent, 'utf8');
};

/**
 * ユーザー統計レポートをExcel形式でエクスポート
 * @param {object} filters - フィルター（startDate, endDate）
 * @returns {Promise<Buffer>} Excelファイルのバッファ
 */
const exportUserReportExcel = async (filters = {}) => {
  const report = await adminService.getUserReport(filters);

  const workbook = new ExcelJS.Workbook();
  
  // サマリーシート
  const summarySheet = workbook.addWorksheet('サマリー');
  summarySheet.columns = [
    { header: '項目', key: 'field', width: 20 },
    { header: '値', key: 'value', width: 15 }
  ];
  summarySheet.addRow({ field: '総ユーザー数', value: report.summary.total });
  summarySheet.addRow({ field: '顧客数', value: report.summary.customers });
  summarySheet.addRow({ field: 'ワーカー数', value: report.summary.workers });
  summarySheet.addRow({ field: '管理者数', value: report.summary.admins });
  summarySheet.addRow({ field: 'アクティブ', value: report.summary.active });
  summarySheet.addRow({ field: '非アクティブ', value: report.summary.inactive });
  summarySheet.addRow({ field: '停止中', value: report.summary.suspended });
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 日付別シート
  const dateSheet = workbook.addWorksheet('日付別');
  dateSheet.columns = [
    { header: '日付', key: 'date', width: 15 },
    { header: 'ユーザー数', key: 'count', width: 15 }
  ];
  report.byDate.forEach(item => {
    dateSheet.addRow({ date: item.date, count: item.count });
  });
  dateSheet.getRow(1).font = { bold: true };
  dateSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 月別シート（データがある場合）
  if (report.byMonth && report.byMonth.length > 0) {
    const monthSheet = workbook.addWorksheet('月別');
    monthSheet.columns = [
      { header: '月', key: 'month', width: 15 },
      { header: 'ユーザー数', key: 'count', width: 15 }
    ];
    report.byMonth.forEach(item => {
      monthSheet.addRow({ month: item.month, count: item.count });
    });
    monthSheet.getRow(1).font = { bold: true };
    monthSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * ワーカー統計レポートをCSV形式でエクスポート
 * @param {object} filters - フィルター（startDate, endDate）
 * @returns {Promise<Buffer>} CSVファイルのバッファ
 */
const exportWorkerReportCSV = async (filters = {}) => {
  const report = await adminService.getWorkerReport(filters);

  let csvContent = '=== サマリー ===\n';
  csvContent += '項目,値\n';
  csvContent += `総ワーカー数,${report.summary.total}\n`;
  csvContent += `保留中,${report.summary.pending}\n`;
  csvContent += `承認済み,${report.summary.approved}\n`;
  csvContent += `却下,${report.summary.rejected}\n`;
  csvContent += `アクティブ,${report.summary.active}\n`;
  csvContent += `非アクティブ,${report.summary.inactive}\n`;
  csvContent += `停止中,${report.summary.suspended}\n`;
  csvContent += `平均評価,${report.summary.averageRating}\n`;
  csvContent += `平均時給,${report.summary.averageHourlyRate}\n`;

  csvContent += '\n=== 日付別 ===\n';
  csvContent += '日付,ワーカー数\n';
  report.byDate.forEach(item => {
    csvContent += `${item.date},${item.count}\n`;
  });

  if (report.byApprovalStatus) {
    csvContent += '\n=== 承認ステータス別 ===\n';
    csvContent += 'ステータス,人数\n';
    Object.entries(report.byApprovalStatus).forEach(([status, count]) => {
      csvContent += `${status},${count}\n`;
    });
  }

  if (report.byStatus) {
    csvContent += '\n=== ステータス別 ===\n';
    csvContent += 'ステータス,人数\n';
    Object.entries(report.byStatus).forEach(([status, count]) => {
      csvContent += `${status},${count}\n`;
    });
  }

  return Buffer.from(csvContent, 'utf8');
};

/**
 * ワーカー統計レポートをExcel形式でエクスポート
 * @param {object} filters - フィルター（startDate, endDate）
 * @returns {Promise<Buffer>} Excelファイルのバッファ
 */
const exportWorkerReportExcel = async (filters = {}) => {
  const report = await adminService.getWorkerReport(filters);

  const workbook = new ExcelJS.Workbook();
  
  // サマリーシート
  const summarySheet = workbook.addWorksheet('サマリー');
  summarySheet.columns = [
    { header: '項目', key: 'field', width: 20 },
    { header: '値', key: 'value', width: 15 }
  ];
  summarySheet.addRow({ field: '総ワーカー数', value: report.summary.total });
  summarySheet.addRow({ field: '保留中', value: report.summary.pending });
  summarySheet.addRow({ field: '承認済み', value: report.summary.approved });
  summarySheet.addRow({ field: '却下', value: report.summary.rejected });
  summarySheet.addRow({ field: 'アクティブ', value: report.summary.active });
  summarySheet.addRow({ field: '非アクティブ', value: report.summary.inactive });
  summarySheet.addRow({ field: '停止中', value: report.summary.suspended });
  summarySheet.addRow({ field: '平均評価', value: report.summary.averageRating });
  summarySheet.addRow({ field: '平均時給', value: report.summary.averageHourlyRate });
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 日付別シート
  const dateSheet = workbook.addWorksheet('日付別');
  dateSheet.columns = [
    { header: '日付', key: 'date', width: 15 },
    { header: 'ワーカー数', key: 'count', width: 15 }
  ];
  report.byDate.forEach(item => {
    dateSheet.addRow({ date: item.date, count: item.count });
  });
  dateSheet.getRow(1).font = { bold: true };
  dateSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 承認ステータス別シート
  if (report.byApprovalStatus) {
    const approvalSheet = workbook.addWorksheet('承認ステータス別');
    approvalSheet.columns = [
      { header: 'ステータス', key: 'status', width: 15 },
      { header: '人数', key: 'count', width: 15 }
    ];
    Object.entries(report.byApprovalStatus).forEach(([status, count]) => {
      approvalSheet.addRow({ status: status, count: count });
    });
    approvalSheet.getRow(1).font = { bold: true };
    approvalSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  // ステータス別シート
  if (report.byStatus) {
    const statusSheet = workbook.addWorksheet('ステータス別');
    statusSheet.columns = [
      { header: 'ステータス', key: 'status', width: 15 },
      { header: '人数', key: 'count', width: 15 }
    ];
    Object.entries(report.byStatus).forEach(([status, count]) => {
      statusSheet.addRow({ status: status, count: count });
    });
    statusSheet.getRow(1).font = { bold: true };
    statusSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  generateCSV,
  generateExcel,
  exportBookingReportCSV,
  exportBookingReportExcel,
  exportRevenueReportCSV,
  exportRevenueReportExcel,
  exportUserReportCSV,
  exportUserReportExcel,
  exportWorkerReportCSV,
  exportWorkerReportExcel
};
