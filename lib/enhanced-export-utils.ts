import type { RoutePoint, CalculatedRoute } from './types'
import ExcelJS from 'exceljs'

/** Export route data to a nicely-styled Excel workbook */
export async function exportToEnhancedXLSX(
  route: CalculatedRoute,
  points: RoutePoint[]
): Promise<void> {
  // 1. Create workbook & worksheet
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('Route Export')

  // 2. Define standard styles
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }, // Blue-600
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  }

  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  }

  const centerStyle: Partial<ExcelJS.Style> = { alignment: { vertical: 'middle', horizontal: 'center' } }
  
  // Helper to apply header style
  const applyHeader = (row: ExcelJS.Row) => {
    row.eachCell((cell) => {
      cell.font = headerStyle.font as ExcelJS.Font
      cell.fill = headerStyle.fill as ExcelJS.Fill
      cell.alignment = headerStyle.alignment as ExcelJS.Alignment
      cell.border = headerStyle.border as ExcelJS.Borders
    })
    row.height = 24
  }

  // Helper for auto-width
  const adjustColumnWidth = (ws: ExcelJS.Worksheet) => {
    ws.columns.forEach((column) => {
      let maxLength = 0
      column.eachCell && column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10
        if (columnLength > maxLength) {
          maxLength = columnLength
        }
      })
      column.width = maxLength < 12 ? 12 : maxLength + 2
    })
  }

  // ==== ROUTE SUMMARY ====
  const summaryTitleRow = ws.addRow(['RESUMO DA ROTA'])
  summaryTitleRow.font = { bold: true, size: 14, color: { argb: 'FF1E293B' } }
  summaryTitleRow.height = 30
  
  const summaryHeader = ws.addRow([
    'Distância Total (km)',
    'Total de Pontos',
    'Ponto Inicial',
    'Ponto Final',
    'Tempo Est. (min)',
  ])
  applyHeader(summaryHeader)

  const summaryRow = ws.addRow([
    route.totalDistance.toFixed(2),
    points.length,
    `${points[route.path[0]].id} - ${points[route.path[0]].description}`,
    `${points[route.path[route.path.length - 1]].id} - ${points[route.path[route.path.length - 1]].description}`,
    Math.round((route.totalDistance / 60) * 60),
  ])
  
  summaryRow.font = { size: 11, color: { argb: 'FF334155' } }
  summaryRow.alignment = { vertical: 'middle', horizontal: 'center' }
  summaryRow.height = 20

  ws.addRow([]) // empty spacer

  // ==== ROUTE SEQUENCE ====
  const seqTitleRow = ws.addRow(['SEQUÊNCIA DA ROTA'])
  seqTitleRow.font = { bold: true, size: 14, color: { argb: 'FF1E293B' } }
  seqTitleRow.height = 30

  const seqHeader = ws.addRow([
    'Ordem',
    'ID',
    'Descrição',
    'Latitude',
    'Longitude',
    'Tipo',
    'Dist. Anterior (km)',
  ])
  applyHeader(seqHeader)

  route.path.forEach((ptIdx, i) => {
    const point = points[ptIdx]
    const isStart = i === 0
    const isEnd = i === route.path.length - 1
    const type = isStart ? 'INÍCIO' : isEnd ? 'FIM' : 'Parada'

    // distance from previous segment
    let distPrev = 0
    if (i > 0) {
      const seg = route.segments.find(
        (s) => s.fromIndex === route.path[i - 1] && s.toIndex === ptIdx
      )
      if (seg) distPrev = seg.distance
    }

    const row = ws.addRow([
      i + 1,
      point.id,
      point.description,
      point.latitude,
      point.longitude,
      type,
      i > 0 ? distPrev : '-',
    ])

    // Styling
    row.height = 20
    row.getCell(1).alignment = centerStyle.alignment as ExcelJS.Alignment
    row.getCell(2).alignment = centerStyle.alignment as ExcelJS.Alignment
    row.getCell(6).alignment = centerStyle.alignment as ExcelJS.Alignment
    row.getCell(7).alignment = centerStyle.alignment as ExcelJS.Alignment

    row.getCell(4).numFmt = '0.000000'
    row.getCell(5).numFmt = '0.000000'
    if (i > 0) row.getCell(7).numFmt = '0.00'

    const rowColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' // White vs Slate-50
    row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } }
        cell.border = borderStyle as ExcelJS.Borders
        cell.font = { color: { argb: 'FF334155' } } 
    })
    
    // Highlight Start/End
    if (isStart) row.getCell(6).font = { bold: true, color: { argb: 'FF16A34A' } } // Green
    if (isEnd) row.getCell(6).font = { bold: true, color: { argb: 'FFDC2626' } } // Red
  })

  ws.addRow([])

  // ==== ROUTE SEGMENTS ====
  const segTitleRow = ws.addRow(['DETALHES DOS TRECHOS'])
  segTitleRow.font = { bold: true, size: 14, color: { argb: 'FF1E293B' } }
  segTitleRow.height = 30

  const segHeader = ws.addRow([
    'Trecho',
    'De (ID)',
    'De (Local)',
    'Para (ID)',
    'Para (Local)',
    'Distância (km)',
    'Tempo (min)',
  ])
  applyHeader(segHeader)

  route.segments.forEach((seg, i) => {
    const from = points[seg.fromIndex]
    const to = points[seg.toIndex]
    const time = Math.round((seg.distance / 60) * 60)

    const row = ws.addRow([
      i + 1,
      from.id,
      from.description,
      to.id,
      to.description,
      seg.distance,
      time,
    ])
    
    row.height = 20
    row.getCell(1).alignment = centerStyle.alignment as ExcelJS.Alignment
    row.getCell(2).alignment = centerStyle.alignment as ExcelJS.Alignment
    row.getCell(4).alignment = centerStyle.alignment as ExcelJS.Alignment
    row.getCell(6).alignment = centerStyle.alignment as ExcelJS.Alignment
    row.getCell(7).alignment = centerStyle.alignment as ExcelJS.Alignment
    
    row.getCell(6).numFmt = '0.00'

    const rowColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC'
    row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } }
        cell.border = borderStyle as ExcelJS.Borders
        cell.font = { color: { argb: 'FF334155' } }
    })
  })

  ws.addRow([])

  // ==== COORDINATES ====
  const coordTitleRow = ws.addRow(['COORDENADAS'])
  coordTitleRow.font = { bold: true, size: 14, color: { argb: 'FF1E293B' } }
  coordTitleRow.height = 30

  const coordHeader = ws.addRow([
    'ID',
    'Descrição',
    'Latitude',
    'Longitude',
    'Tipo',
    'Notas',
  ])
  applyHeader(coordHeader)

  points.forEach((pt, i) => {
    const isStart = route.path[0] === i
    const isEnd = route.path[route.path.length - 1] === i
    const type = isStart ? 'INÍCIO' : isEnd ? 'FIM' : 'Parada'

    const row = ws.addRow([
      pt.id,
      pt.description,
      pt.latitude,
      pt.longitude,
      type,
      '',
    ])

    row.height = 20
    row.getCell(1).alignment = centerStyle.alignment as ExcelJS.Alignment
    row.getCell(2).alignment = centerStyle.alignment as ExcelJS.Alignment
    row.getCell(5).alignment = centerStyle.alignment as ExcelJS.Alignment

    row.getCell(3).numFmt = '0.000000'
    row.getCell(4).numFmt = '0.000000'

    const rowColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC'
    row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } }
        cell.border = borderStyle as ExcelJS.Borders
        cell.font = { color: { argb: 'FF334155' } }
    })
  })

  // Auto-width for all columns
  adjustColumnWidth(ws)

  // 3. Generate the file and trigger download in the browser
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `rota_exportada_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
