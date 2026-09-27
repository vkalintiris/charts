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
  const gap = chartUI.chart.getAttribute("heatmapCellGap") || 0

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

      const x = p.canvasx - barWidth / 2 + gap / 2
      const y = g.toDomYCoord(index) - height / 2 + gap / 2

      ctx.fillStyle = getColor(value)
      ctx.fillRect(x, y, barWidth - gap, height - gap)

      ctx.strokeStyle = "transparent"
      ctx.strokeRect(x, y, barWidth - gap, height - gap)
    })
  })
}
