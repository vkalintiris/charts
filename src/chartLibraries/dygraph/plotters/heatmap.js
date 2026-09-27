import { makeGetColor } from "@/helpers/heatmap"

export default chartUI => plotter => {
  if (!chartUI) return

  // We need to handle all the series simultaneously.
  if (plotter.seriesIndex !== 0) return

  const g = plotter.dygraph
  const ctx = plotter.drawingContext
  const sets = plotter.allSeriesPoints
  const series = g.layout_.setNames

  let minWidthSep = Infinity
  sets.forEach(points => {
    const widthSep = points[1].canvasx - points[0].canvasx
    if (widthSep < minWidthSep) minWidthSep = widthSep
  })

  const barWidth = Math.floor(minWidthSep)

  const getColor = makeGetColor(chartUI.chart)

  series.forEach((seriesName, j) => {
    const index = chartUI.chart.getHeatmapYIndex(seriesName)

    if (index === -1) return

    const height = Math.abs(
      index === 0
        ? g.toDomYCoord(index + 1) - g.toDomYCoord(index)
        : g.toDomYCoord(index) - g.toDomYCoord(index - 1)
    )

    sets[j].forEach((p, i) => {
      const rowIndex = Number.isInteger(p.idx) ? p.idx : i
      const value = chartUI.chart.getDimensionValue(seriesName, rowIndex, { allowNull: true })

      ctx.fillStyle = getColor(value)
      ctx.fillRect(p.canvasx - barWidth / 2, g.toDomYCoord(index) - height / 2, barWidth, height)

      ctx.strokeStyle = "transparent"
      ctx.strokeRect(p.canvasx - barWidth / 2, g.toDomYCoord(index) - height / 2, barWidth, height)
    })
  })

  drawMarkers(chartUI.chart, g, ctx)
}

// Opt-in points drawn over the cells, e.g. a percentile per column: [{ x: ms, id: dimensionId }].
const drawMarkers = (chart, g, ctx) => {
  const markers = chart.getAttribute("heatmapMarkers")
  if (!Array.isArray(markers) || !markers.length) return

  ctx.save()
  ctx.fillStyle = "#ffffff"
  ctx.strokeStyle = "#000000"
  ctx.lineWidth = 1
  markers.forEach(({ x, id }) => {
    const index = chart.getHeatmapYIndex(id)
    if (index === -1) return

    ctx.beginPath()
    ctx.arc(g.toDomXCoord(x), g.toDomYCoord(index), 3, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  })
  ctx.restore()
}
