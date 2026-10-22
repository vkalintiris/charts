import { makeGetColor, getMarkedHeatmapCell } from "@/helpers/heatmap"
import makeHeatmapCell from "../heatmapCell"

const markedLineWidth = 2

const strokeInside = (ctx, { x, y, width, height }, lineWidth) => {
  ctx.lineWidth = lineWidth
  ctx.strokeRect(
    x + lineWidth / 2,
    y + lineWidth / 2,
    Math.max(0, width - lineWidth),
    Math.max(0, height - lineWidth)
  )
}

export default chartUI => plotter => {
  if (!chartUI) return

  // We need to handle all the series simultaneously.
  if (plotter.seriesIndex !== 0) return

  const g = plotter.dygraph
  const ctx = plotter.drawingContext
  const sets = plotter.allSeriesPoints
  const series = g.layout_.setNames
  if (!sets.length) return

  const getCell = makeHeatmapCell(g, sets[0], {
    gap: chartUI.chart.getAttribute("heatmapCellGap"),
  })
  const getColor = makeGetColor(chartUI.chart)

  series.forEach((seriesName, j) => {
    const index = chartUI.chart.getHeatmapYIndex(seriesName)

    if (index === -1) return

    sets[j].forEach((p, i) => {
      const rowIndex = Number.isInteger(p.idx) ? p.idx : i
      const value = chartUI.chart.getDimensionValue(seriesName, rowIndex, { allowNull: true })
      const { x, y, width, height } = getCell(p.canvasx, index)

      ctx.fillStyle = getColor(value)
      ctx.fillRect(x, y, width, height)
    })
  })

  const marked = getMarkedHeatmapCell(chartUI.chart, () => g.xAxisRange())
  const markedX = marked && chartUI.chart.getPayload().data[marked.row]?.[0]
  if (markedX == null) return

  ctx.save()
  ctx.strokeStyle = chartUI.chart.getThemeAttribute("themeHeatmapMarkedCell")
  strokeInside(ctx, getCell(g.toDomXCoord(markedX), marked.yIndex), markedLineWidth)
  ctx.restore()
}
