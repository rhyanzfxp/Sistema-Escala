import ExcelJS from 'exceljs';
import { ScheduleItem } from '../types/database';
import { formatDateBR } from './api';

export async function exportScheduleToExcel(
  scheduleItems: ScheduleItem[],
  monthName: string,
  churchName: string
) {
  if (!scheduleItems || scheduleItems.length === 0) {
    throw new Error('Nenhuma escala para exportar.');
  }

  // Ordena os itens por data e hora
  const sortedItems = [...scheduleItems].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.day_time.localeCompare(b.day_time);
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Escala - CCHABITAREI';
  workbook.lastModifiedBy = 'Sistema de Escala';
  workbook.created = new Date();

  const sheetName = monthName.toUpperCase().replace(/\s+/g, '_');
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }]
  });

  // Estilos de cores
  const primaryNavy = '1F497D';
  const headerGold = 'C9A87A';
  const weekBannerBg = '7F6000';
  const rowZebraBg = 'F4F6F9';

  // 1. TÍTULO PRINCIPAL (Linha 1 e 2)
  worksheet.mergeCells('A1:I2');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'ESCALA DE LOUVOR - CCHABITAREI';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + primaryNavy } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 2. SUBTÍTULO (Linha 3)
  worksheet.mergeCells('A3:I3');
  const subTitleCell = worksheet.getCell('A3');
  const displayChurch = churchName === 'todas' ? 'Todas as Igrejas' : `Igreja ${churchName.toUpperCase()}`;
  subTitleCell.value = `MÊS: ${monthName.toUpperCase()}  |  ${displayChurch.toUpperCase()}`;
  subTitleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF' + headerGold } };
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12253E' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Linha 4 vazia
  worksheet.getRow(4).height = 10;

  // 3. CABEÇALHO DA TABELA (Linha 5)
  const headers = [
    'Data',
    'Dia/Hora',
    'Culto/Evento',
    'Tecladista',
    'Violão/Guitar',
    'Baixista',
    'Baterista',
    'Ministro/Vocais',
    'Observações'
  ];

  const headerRow = worksheet.getRow(5);
  headerRow.height = 26;
  headers.forEach((headerText, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = headerText;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + primaryNavy } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF102A45' } },
      bottom: { style: 'medium', color: { argb: 'FF102A45' } },
      left: { style: 'thin', color: { argb: 'FFA6B9D0' } },
      right: { style: 'thin', color: { argb: 'FFA6B9D0' } }
    };
  });

  // Agrupa os cultos por semana (week_num ou cálculo por data)
  const groupedByWeek: Map<number, ScheduleItem[]> = new Map();

  sortedItems.forEach((item) => {
    let weekNum = item.week_num;
    if (!weekNum) {
      const day = parseInt(item.date.split('-')[2] || '1', 10);
      weekNum = Math.ceil(day / 7);
    }
    if (!groupedByWeek.has(weekNum)) {
      groupedByWeek.set(weekNum, []);
    }
    groupedByWeek.get(weekNum)!.push(item);
  });

  let currentRowIdx = 6;
  const sortedWeekNums = Array.from(groupedByWeek.keys()).sort((a, b) => a - b);

  sortedWeekNums.forEach((weekNum) => {
    const itemsInWeek = groupedByWeek.get(weekNum)!;

    // BANNER DA SEMANA
    worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
    const weekBannerCell = worksheet.getCell(`A${currentRowIdx}`);
    const hasSantaCeia = itemsInWeek.some(it => it.title.toUpperCase().includes('SANTA CEIA') || it.week_num === 1);
    const santaCeiaLabel = (weekNum === 1 || hasSantaCeia) ? ' (SANTA CEIA)' : '';
    weekBannerCell.value = `${weekNum}ª SEMANA${santaCeiaLabel}`;
    weekBannerCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    weekBannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + weekBannerBg } };
    weekBannerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    const bannerRow = worksheet.getRow(currentRowIdx);
    bannerRow.height = 22;
    currentRowIdx++;

    // LINHAS DOS CULTOS DA SEMANA
    itemsInWeek.forEach((item, itemIdx) => {
      const row = worksheet.getRow(currentRowIdx);
      row.height = 21;
      const isZebra = itemIdx % 2 === 1;
      const rowBg = isZebra ? rowZebraBg : 'FFFFFF';

      const rowValues = [
        formatDateBR(item.date),
        item.day_time,
        item.title,
        item.keyboard_member || '-',
        item.guitar_member || '-',
        item.bass_member || '-',
        item.drums_member || '-',
        item.vocal_members || '-',
        ''
      ];

      rowValues.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1A1A1A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + rowBg } };
        cell.alignment = {
          horizontal: colIdx <= 2 ? 'center' : 'center',
          vertical: 'middle',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        };
      });

      currentRowIdx++;
    });
  });

  // Linha de Rodapé / Estatísticas
  currentRowIdx++;
  worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
  const footerCell = worksheet.getCell(`A${currentRowIdx}`);
  const todayStr = new Date().toLocaleDateString('pt-BR');
  footerCell.value = `Total de Cultos: ${sortedItems.length}   |   Gerado em: ${todayStr} via Sistema de Escala Louvor`;
  footerCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF555555' } };
  footerCell.alignment = { horizontal: 'right', vertical: 'middle' };

  // Largura das colunas (auto-ajustadas e elegantes)
  worksheet.getColumn(1).width = 14; // Data
  worksheet.getColumn(2).width = 24; // Dia/Hora
  worksheet.getColumn(3).width = 30; // Culto/Evento
  worksheet.getColumn(4).width = 20; // Tecladista
  worksheet.getColumn(5).width = 22; // Violão/Guitar
  worksheet.getColumn(6).width = 20; // Baixista
  worksheet.getColumn(7).width = 20; // Baterista
  worksheet.getColumn(8).width = 32; // Ministro/Vocais
  worksheet.getColumn(9).width = 20; // Observações

  // Gerar e fazer download do arquivo no navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const cleanMonth = monthName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanChurch = churchName.replace(/[^a-zA-Z0-9_-]/g, '_');
  anchor.download = `Escala_Louvor_${cleanChurch}_${cleanMonth}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
