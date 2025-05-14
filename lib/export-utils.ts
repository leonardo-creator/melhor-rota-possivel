import type { RoutePoint, CalculatedRoute } from "./types"

/**
 * Generate a formatted XLSX file with route data
 * Uses client-side Excel generation with styling
 */
export function exportToXLSX(route: CalculatedRoute, points: RoutePoint[]): void {
  // Since we can't use the xlsx library directly in this environment,
  // we'll create a well-formatted HTML table and export it to Excel format

  // Create a container for our Excel-like content
  const container = document.createElement("div")
  container.style.display = "none"
  document.body.appendChild(container)

  // Create the HTML content that will be converted to Excel
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Route Summary</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table, th, td {
          border: 1px solid black;
          border-collapse: collapse;
          padding: 5px;
        }
        th {
          background-color: #3700ff;
          color: white;
          font-weight: bold;
        }
        .section-header {
          background-color: #110043;
          color: white;
          font-weight: bold;
          font-size: 14pt;
        }
        .summary-label {
          background-color: #42eedc;
          color: #110043;
          font-weight: bold;
        }
        .summary-value {
          background-color: #f1f5f9;
          font-weight: bold;
        }
        .start-point {
          background-color: #a2ff00;
          color: #110043;
        }
        .end-point {
          background-color: #ff3f19;
          color: white;
        }
        .waypoint {
          background-color: #42eedc;
          color: #110043;
        }
        .distance-cell {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: right;
        }
        .time-cell {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: right;
        }
        .header-row {
          background-color: #3700ff;
          color: white;
          font-weight: bold;
        }
        .alt-row {
          background-color: #f1f5f9;
        }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="5" class="section-header">Route Summary</td>
        </tr>
        <tr>
          <td class="summary-label">Total Distance</td>
          <td class="summary-value">${route.totalDistance.toFixed(2)} km</td>
          <td></td>
          <td class="summary-label">Total Points</td>
          <td class="summary-value">${points.length}</td>
        </tr>
        <tr>
          <td class="summary-label">Start Point</td>
          <td class="summary-value">${points[route.path[0]].id}: ${points[route.path[0]].description}</td>
          <td></td>
          <td class="summary-label">End Point</td>
          <td class="summary-value">${points[route.path[route.path.length - 1]].id}: ${
            points[route.path[route.path.length - 1]].description
          }</td>
        </tr>
        <tr>
          <td class="summary-label">Estimated Time</td>
          <td class="summary-value">${formatTime(route.totalDistance / 60)}</td>
          <td></td>
          <td class="summary-label">Export Date</td>
          <td class="summary-value">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      
      <br>
      
      <table>
        <tr>
          <td colspan="5" class="section-header">Route Sequence</td>
        </tr>
        <tr class="header-row">
          <th>Order</th>
          <th>Point ID</th>
          <th>Description</th>
          <th>Latitude</th>
          <th>Longitude</th>
        </tr>
        ${route.path
          .map((pointIndex, i) => {
            const point = points[pointIndex]
            const isStart = i === 0
            const isEnd = i === route.path.length - 1
            const rowClass = isStart ? "start-point" : isEnd ? "end-point" : i % 2 === 0 ? "alt-row" : "waypoint"
            return `
              <tr class="${rowClass}">
                <td>${i + 1}</td>
                <td>${point.id}</td>
                <td>${point.description}</td>
                <td>${point.latitude.toFixed(6)}</td>
                <td>${point.longitude.toFixed(6)}</td>
              </tr>
            `
          })
          .join("")}
      </table>
      
      <br>
      
      <table>
        <tr>
          <td colspan="7" class="section-header">Route Segments</td>
        </tr>
        <tr class="header-row">
          <th>Segment</th>
          <th>From ID</th>
          <th>From Description</th>
          <th>To ID</th>
          <th>To Description</th>
          <th>Distance (km)</th>
          <th>Est. Time</th>
        </tr>
        ${route.segments
          .map((segment, i) => {
            const fromPoint = points[segment.fromIndex]
            const toPoint = points[segment.toIndex]
            const timeMinutes = Math.round((segment.distance / 60) * 60)
            const rowClass = i % 2 === 0 ? "alt-row" : ""
            return `
              <tr class="${rowClass}">
                <td>${i + 1}</td>
                <td>${fromPoint.id}</td>
                <td>${fromPoint.description}</td>
                <td>${toPoint.id}</td>
                <td>${toPoint.description}</td>
                <td class="distance-cell">${segment.distance.toFixed(2)}</td>
                <td class="time-cell">${timeMinutes} min</td>
              </tr>
            `
          })
          .join("")}
        <tr class="header-row">
          <td colspan="5" style="text-align: right; font-weight: bold;">Total:</td>
          <td class="distance-cell">${route.totalDistance.toFixed(2)}</td>
          <td class="time-cell">${Math.round((route.totalDistance / 60) * 60)} min</td>
        </tr>
      </table>
      
      <br>
      
      <table>
        <tr>
          <td colspan="4" class="section-header">Coordinates (Raw Data)</td>
        </tr>
        <tr class="header-row">
          <th>ID</th>
          <th>Description</th>
          <th>Latitude</th>
          <th>Longitude</th>
        </tr>
        ${points
          .map((point, i) => {
            const rowClass = i % 2 === 0 ? "alt-row" : ""
            return `
              <tr class="${rowClass}">
                <td>${point.id}</td>
                <td>${point.description}</td>
                <td>${point.latitude.toFixed(6)}</td>
                <td>${point.longitude.toFixed(6)}</td>
              </tr>
            `
          })
          .join("")}
      </table>
    </body>
    </html>
  `

  // Set the HTML content
  container.innerHTML = html

  // Create a Blob with the HTML content
  const blob = new Blob([container.outerHTML], { type: "application/vnd.ms-excel" })

  // Create a download link
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "route_data.xls"

  // Trigger the download
  document.body.appendChild(link)
  link.click()

  // Clean up
  document.body.removeChild(link)
  document.body.removeChild(container)
  URL.revokeObjectURL(link.href)
}

// Helper function to format time in hours and minutes
function formatTime(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)

  if (wholeHours === 0) {
    return `${minutes} min`
  } else if (minutes === 0) {
    return `${wholeHours} h`
  } else {
    return `${wholeHours} h ${minutes} min`
  }
}
