import type { RoutePoint, CalculatedRoute } from "./types"

export function exportToEnhancedXLSX(route: CalculatedRoute, points: RoutePoint[]): void {
  // Since we can't use the xlsx library directly in this environment,
  // we'll create a HTML table that can be copied to Excel with formatting
  // and also provide a CSV download option

  // Create a temporary container
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.top = "0"
  container.style.left = "0"
  container.style.width = "100%"
  container.style.height = "100%"
  container.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
  container.style.zIndex = "9999"
  container.style.display = "flex"
  container.style.flexDirection = "column"
  container.style.alignItems = "center"
  container.style.justifyContent = "center"
  container.style.padding = "20px"
  container.style.boxSizing = "border-box"
  container.style.overflow = "auto"

  // Create header
  const header = document.createElement("div")
  header.style.width = "100%"
  header.style.maxWidth = "800px"
  header.style.backgroundColor = "#1a0063"
  header.style.color = "#f1f5f9"
  header.style.padding = "15px"
  header.style.borderRadius = "8px 8px 0 0"
  header.style.display = "flex"
  header.style.justifyContent = "space-between"
  header.style.alignItems = "center"
  header.style.marginBottom = "2px"
  header.innerHTML = `
    <h2 style="margin: 0; font-size: 18px;">Route Data Export</h2>
    <div>
      <button id="copy-excel-btn" style="background-color: #3700ff; color: #f1f5f9; border: none; padding: 8px 12px; border-radius: 4px; margin-right: 8px; cursor: pointer;">Copy to Excel</button>
      <button id="download-csv-btn" style="background-color: #a2ff00; color: #110043; border: none; padding: 8px 12px; border-radius: 4px; margin-right: 8px; cursor: pointer;">Download CSV</button>
      <button id="close-export-btn" style="background-color: #ff3f19; color: #f1f5f9; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Close</button>
    </div>
  `
  container.appendChild(header)

  // Create content container
  const content = document.createElement("div")
  content.style.width = "100%"
  content.style.maxWidth = "800px"
  content.style.backgroundColor = "#110043"
  content.style.color = "#f1f5f9"
  content.style.padding = "15px"
  content.style.borderRadius = "0 0 8px 8px"
  content.style.overflowX = "auto"
  container.appendChild(content)

  // Create HTML table that can be copied to Excel
  const table = document.createElement("table")
  table.id = "export-table"
  table.style.width = "100%"
  table.style.borderCollapse = "collapse"
  table.style.fontSize = "14px"
  table.style.color = "#f1f5f9"

  // Add route summary section
  let tableHTML = `
    <thead>
      <tr style="background-color: #3700ff;">
        <th colspan="7" style="padding: 10px; text-align: center; border: 1px solid #42eedc; font-size: 16px;">ROUTE SUMMARY</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background-color: #1a0063;">
        <td style="padding: 8px; border: 1px solid #42eedc; font-weight: bold;">Total Distance</td>
        <td style="padding: 8px; border: 1px solid #42eedc;" colspan="6">${route.totalDistance.toFixed(2)} km</td>
      </tr>
      <tr style="background-color: #1a0063;">
        <td style="padding: 8px; border: 1px solid #42eedc; font-weight: bold;">Total Points</td>
        <td style="padding: 8px; border: 1px solid #42eedc;" colspan="6">${points.length}</td>
      </tr>
      <tr style="background-color: #1a0063;">
        <td style="padding: 8px; border: 1px solid #42eedc; font-weight: bold;">Start Point</td>
        <td style="padding: 8px; border: 1px solid #42eedc;" colspan="6">${points[route.path[0]].id} (${points[route.path[0]].description})</td>
      </tr>
      <tr style="background-color: #1a0063;">
        <td style="padding: 8px; border: 1px solid #42eedc; font-weight: bold;">End Point</td>
        <td style="padding: 8px; border: 1px solid #42eedc;" colspan="6">${points[route.path[route.path.length - 1]].id} (${points[route.path[route.path.length - 1]].description})</td>
      </tr>
      <tr style="background-color: #1a0063;">
        <td style="padding: 8px; border: 1px solid #42eedc; font-weight: bold;">Estimated Time</td>
        <td style="padding: 8px; border: 1px solid #42eedc;" colspan="6">${Math.round((route.totalDistance / 60) * 60)} minutes</td>
      </tr>
      
      <tr><td colspan="7" style="padding: 10px;"></td></tr>
      
      <tr style="background-color: #3700ff;">
        <th colspan="7" style="padding: 10px; text-align: center; border: 1px solid #42eedc; font-size: 16px;">ROUTE SEQUENCE</th>
      </tr>
      <tr style="background-color: #1a0063;">
        <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Order</th>
        <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Point ID</th>
        <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Description</th>
        <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Latitude</th>
        <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Longitude</th>
        <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Type</th>
        <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Distance from Previous</th>
      </tr>
  `

  // Add route sequence data
  route.path.forEach((pointIndex, i) => {
    const point = points[pointIndex]
    const isStart = i === 0
    const isEnd = i === route.path.length - 1
    const pointType = isStart ? "Start" : isEnd ? "End" : "Waypoint"
    const bgColor = isStart ? "#a2ff00" : isEnd ? "#ff3f19" : "#110043"
    const textColor = isStart || isEnd ? "#110043" : "#f1f5f9"

    // Calculate distance from previous point
    let distanceFromPrev = ""
    if (i > 0) {
      const prevSegment = route.segments.find((s) => s.fromIndex === route.path[i - 1] && s.toIndex === pointIndex)
      if (prevSegment) {
        distanceFromPrev = `${prevSegment.distance.toFixed(2)} km`
      }
    }

    tableHTML += `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: center; color: ${textColor};">${i + 1}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: center; color: ${textColor};">${point.id}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; color: ${textColor};">${point.description}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: right; color: ${textColor};">${point.latitude.toFixed(6)}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: right; color: ${textColor};">${point.longitude.toFixed(6)}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: center; color: ${textColor}; font-weight: bold;">${pointType}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: right; color: ${textColor};">${distanceFromPrev}</td>
      </tr>
    `
  })

  // Add route segments section
  tableHTML += `
    <tr><td colspan="7" style="padding: 10px;"></td></tr>
    
    <tr style="background-color: #3700ff;">
      <th colspan="7" style="padding: 10px; text-align: center; border: 1px solid #42eedc; font-size: 16px;">ROUTE SEGMENTS</th>
    </tr>
    <tr style="background-color: #1a0063;">
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Segment</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">From ID</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">From Description</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">To ID</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">To Description</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Distance (km)</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Est. Time (min)</th>
    </tr>
  `

  // Add segment data
  route.segments.forEach((segment, i) => {
    const fromPoint = points[segment.fromIndex]
    const toPoint = points[segment.toIndex]
    const timeMinutes = Math.round((segment.distance / 60) * 60)
    const isFirstSegment = i === 0
    const isLastSegment = i === route.segments.length - 1

    // Alternate row colors for better readability
    const bgColor = i % 2 === 0 ? "#1a0063" : "#110043"

    tableHTML += `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: center;">${i + 1}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: center; ${isFirstSegment ? "background-color: #a2ff00; color: #110043;" : ""}">${fromPoint.id}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; ${isFirstSegment ? "background-color: #a2ff00; color: #110043;" : ""}">${fromPoint.description}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: center; ${isLastSegment ? "background-color: #ff3f19; color: #110043;" : ""}">${toPoint.id}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; ${isLastSegment ? "background-color: #ff3f19; color: #110043;" : ""}">${toPoint.description}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: right; font-weight: bold;">${segment.distance.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: right;">${timeMinutes}</td>
      </tr>
    `
  })

  // Add coordinates section
  tableHTML += `
    <tr><td colspan="7" style="padding: 10px;"></td></tr>
    
    <tr style="background-color: #3700ff;">
      <th colspan="7" style="padding: 10px; text-align: center; border: 1px solid #42eedc; font-size: 16px;">COORDINATES</th>
    </tr>
    <tr style="background-color: #1a0063;">
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">ID</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Description</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Latitude</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Longitude</th>
      <th style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Type</th>
      <th colspan="2" style="padding: 8px; border: 1px solid #42eedc; text-align: center;">Notes</th>
    </tr>
  `

  // Add coordinates data
  points.forEach((point, i) => {
    // Determine if this point is a start, end, or waypoint
    const isStart = route.path[0] === i
    const isEnd = route.path[route.path.length - 1] === i
    const pointType = isStart ? "Start" : isEnd ? "End" : "Waypoint"
    const bgColor = isStart ? "#a2ff00" : isEnd ? "#ff3f19" : i % 2 === 0 ? "#1a0063" : "#110043"
    const textColor = isStart || isEnd ? "#110043" : "#f1f5f9"

    tableHTML += `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: center; color: ${textColor};">${point.id}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; color: ${textColor};">${point.description}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: right; color: ${textColor};">${point.latitude.toFixed(6)}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: right; color: ${textColor};">${point.longitude.toFixed(6)}</td>
        <td style="padding: 8px; border: 1px solid #42eedc; text-align: center; color: ${textColor}; font-weight: bold;">${pointType}</td>
        <td colspan="2" style="padding: 8px; border: 1px solid #42eedc; color: ${textColor};"></td>
      </tr>
    `
  })

  tableHTML += `</tbody>`
  table.innerHTML = tableHTML
  content.appendChild(table)

  // Add to document
  document.body.appendChild(container)

  // Create CSV content for download
  let csvContent = "data:text/csv;charset=utf-8,"

  // Add summary section
  csvContent += "ROUTE SUMMARY\r\n"
  csvContent += `Total Distance (km),${route.totalDistance.toFixed(2)}\r\n`
  csvContent += `Total Points,${points.length}\r\n`
  csvContent += `Start Point,${points[route.path[0]].id}\r\n`
  csvContent += `End Point,${points[route.path[route.path.length - 1]].id}\r\n`
  csvContent += `Estimated Time (min),${Math.round((route.totalDistance / 60) * 60)}\r\n\r\n`

  // Add route sequence section
  csvContent += "ROUTE SEQUENCE\r\n"
  csvContent += "Order,Point ID,Description,Latitude,Longitude,Type,Distance from Previous\r\n"

  route.path.forEach((pointIndex, i) => {
    const point = points[pointIndex]
    const isStart = i === 0
    const isEnd = i === route.path.length - 1
    const pointType = isStart ? "Start" : isEnd ? "End" : "Waypoint"

    // Calculate distance from previous point
    let distanceFromPrev = ""
    if (i > 0) {
      const prevSegment = route.segments.find((s) => s.fromIndex === route.path[i - 1] && s.toIndex === pointIndex)
      if (prevSegment) {
        distanceFromPrev = prevSegment.distance.toFixed(2)
      }
    }

    csvContent += `${i + 1},${point.id},"${point.description}",${point.latitude.toFixed(6)},${point.longitude.toFixed(6)},${pointType},${distanceFromPrev}\r\n`
  })

  csvContent += "\r\nROUTE SEGMENTS\r\n"
  csvContent += "Segment,From ID,From Description,To ID,To Description,Distance (km),Est. Time (min)\r\n"

  route.segments.forEach((segment, i) => {
    const fromPoint = points[segment.fromIndex]
    const toPoint = points[segment.toIndex]
    const timeMinutes = Math.round((segment.distance / 60) * 60)

    csvContent += `${i + 1},${fromPoint.id},"${fromPoint.description}",${toPoint.id},"${toPoint.description}",${segment.distance.toFixed(2)},${timeMinutes}\r\n`
  })

  csvContent += "\r\nCOORDINATES\r\n"
  csvContent += "ID,Description,Latitude,Longitude,Type,Notes\r\n"

  points.forEach((point, i) => {
    // Determine if this point is a start, end, or waypoint
    const isStart = route.path[0] === i
    const isEnd = route.path[route.path.length - 1] === i
    const pointType = isStart ? "Start" : isEnd ? "End" : "Waypoint"

    csvContent += `${point.id},"${point.description}",${point.latitude.toFixed(6)},${point.longitude.toFixed(6)},${pointType},\r\n`
  })

  // Add event listeners
  document.getElementById("copy-excel-btn")?.addEventListener("click", () => {
    const range = document.createRange()
    range.selectNode(table)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    document.execCommand("copy")
    window.getSelection()?.removeAllRanges()
    alert("Table copied to clipboard! You can now paste it into Excel.")
  })

  document.getElementById("download-csv-btn")?.addEventListener("click", () => {
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "route_data.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })

  document.getElementById("close-export-btn")?.addEventListener("click", () => {
    document.body.removeChild(container)
  })
}
