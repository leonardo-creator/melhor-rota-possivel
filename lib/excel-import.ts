import * as XLSX from 'xlsx'
import type { ExcelRowData, RoutePoint, ImportResult } from './types'

/**
 * Processes Excel file and converts it to RoutePoint array
 * Expected Excel structure: index, name, status, description, fileSize, fileType, date, Latitude, Longitude, predictionDate
 */
export function importFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          resolve({ success: false, error: 'Falha ao ler o arquivo' })
          return
        }

        // Parse the Excel file
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        
        if (!sheetName) {
          resolve({ success: false, error: 'Nenhuma planilha encontrada no arquivo' })
          return
        }

        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[]

        if (!jsonData || jsonData.length === 0) {
          resolve({ success: false, error: 'Nenhum dado encontrado na planilha' })
          return
        }

        // Validate required columns
        const firstRow = jsonData[0]
        const requiredFields = ['Latitude', 'Longitude']
        const missingFields = requiredFields.filter(field => !(field in firstRow))
        
        if (missingFields.length > 0) {
          resolve({ 
            success: false, 
            error: `Colunas obrigatórias ausentes: ${missingFields.join(', ')}. Certifique-se de que as colunas Latitude e Longitude estão presentes.` 
          })
          return
        }

        // Convert Excel data to RoutePoint array
        const routePoints: RoutePoint[] = []
        let validRows = 0

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i]
          
          // Validate latitude and longitude
          const lat = parseFloat(String(row.Latitude))
          const lng = parseFloat(String(row.Longitude))
          
          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Linha ${i + 1}: Coordenadas inválidas (Lat: ${row.Latitude}, Lng: ${row.Longitude})`)
            continue
          }

          // Validate coordinate ranges
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`Linha ${i + 1}: Coordenadas fora do intervalo válido (Lat: ${lat}, Lng: ${lng})`)
            continue
          }

          // Create RoutePoint from Excel data
          const routePoint: RoutePoint = {
            id: typeof row.index === 'number' ? row.index : validRows + 1,
            description: row.name || row.description || `Ponto ${validRows + 1}`,
            latitude: lat,
            longitude: lng
          }

          routePoints.push(routePoint)
          validRows++
        }

        if (routePoints.length === 0) {
          resolve({ 
            success: false, 
            error: 'Nenhum ponto de rota válido foi encontrado. Verifique se as coordenadas estão corretas.' 
          })
          return
        }

        resolve({ 
          success: true, 
          data: routePoints, 
          rowsProcessed: validRows 
        })

      } catch (error) {
        resolve({ 
          success: false, 
          error: `Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
        })
      }
    }

    reader.onerror = () => {
      resolve({ success: false, error: 'Erro ao ler o arquivo' })
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * Validates if a file is a valid Excel file
 */
export function isValidExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv (also supported by xlsx library)
  ]
  
  const validExtensions = ['.xlsx', '.xls', '.csv']
  const hasValidType = validTypes.includes(file.type)
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  
  return hasValidType || hasValidExtension
}

/**
 * Gets file format information for user display
 */
export function getFileFormatInfo(): string {
  return `Formato esperado da planilha:
• Colunas obrigatórias: Latitude, Longitude
• Colunas opcionais: index, name, description, status, fileSize, fileType, date, predictionDate
• Coordenadas devem estar em formato decimal (ex: -12.039469444444444)
• Tipos de arquivo aceitos: .xlsx, .xls, .csv`
}
