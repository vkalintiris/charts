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

  drawMarkers(chartUI.chart, g, ctx, barWidth)
}

const MARKER_RADIUS = 3
const MIN_MARKER_RADIUS = 1.25

// Opt-in points drawn over the cells, e.g. percentiles per column:
// [{ x: ms, id: dimensionId, color?, slot?, slots? }]. A marker with `slots` takes the `slot`-th of that many
// equal places across its cell, sized to fit; a colored marker gets a white outline, an uncolored one is white
// with a dark outline.
const drawMarkers = (chart, g, ctx, barWidth) => {
  const markers = chart.getAttribute("heatmapMarkers")
  if (!Array.isArray(markers) || !markers.length) return

  ctx.save()
  ctx.lineWidth = 1
  markers.forEach(({ x, id, color, slot = 0, slots = 1 }) => {
    const index = chart.getHeatmapYIndex(id)
    if (index === -1) return

    const place = barWidth / slots
    const radius =
      slots > 1
        ? Math.max(MIN_MARKER_RADIUS, Math.min(MARKER_RADIUS, place / 2 - 0.5))
        : MARKER_RADIUS
    const cx = g.toDomXCoord(x) + (slot - (slots - 1) / 2) * place

    ctx.fillStyle = color || "#ffffff"
    ctx.strokeStyle = color ? "#ffffff" : "#000000"
    ctx.beginPath()
    ctx.arc(cx, g.toDomYCoord(index), radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  })
  ctx.restore()
}
