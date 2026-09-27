const themeAttrByFlavour = {
  hover: "themeCrosshair",
  click: "themeNetdata",
  default: "themeCrosshair",
}

const lineDashByFlavour = {
  hover: [5, 5],
  click: [2, 2],
  default: [5, 5],
}

import { isHeatmap } from "@/helpers/heatmap"

// Dygraph only clears a thin strip around the previous crosshair, so the outline erases itself.
const outlines = new WeakMap()

export const clearHoveredCell = chartUI => {
  const rect = outlines.get(chartUI)
  if (!rect) return

  outlines.delete(chartUI)
  const [x, y, width, height] = rect
  chartUI.getDygraph().canvas_ctx_.clearRect(x - 2, y - 2, width + 4, height + 4)
}

const outlineHoveredCell = (chartUI, dygraph, ctx, row, dimensionId) => {
  const { chart } = chartUI
  const index = chart.getHeatmapYIndex(dimensionId)
  if (index === -1) return

  const { data } = chart.getPayload()
  const neighbour = data[row + 1] || data[row - 1]
  if (!Array.isArray(neighbour)) return

  const x = dygraph.toDomXCoord(data[row][0])
  const width = Math.abs(dygraph.toDomXCoord(neighbour[0]) - x)
  const height = Math.abs(
    index === 0
      ? dygraph.toDomYCoord(index + 1) - dygraph.toDomYCoord(index)
      : dygraph.toDomYCoord(index) - dygraph.toDomYCoord(index - 1)
  )

  ctx.save()
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1.5
  ctx.strokeStyle =
    chart.getAttribute("heatmapHoverColor") || chart.getThemeAttribute(themeAttrByFlavour.hover)
  const rect = [x - width / 2, dygraph.toDomYCoord(index) - height / 2, width, height]
  ctx.strokeRect(...rect)
  ctx.restore()
  outlines.set(chartUI, rect)
}

export default (chartUI, row, flavour = "hover", dimensionId) => {
  const dygraph = chartUI.getDygraph()

  const { h } = dygraph.getArea()
  const { canvas_ctx_: ctx } = dygraph

  const rowData = chartUI.chart.getPayload().data[row]

  if (!Array.isArray(rowData)) return

  const x = dygraph.toDomXCoord(rowData[0])

  clearHoveredCell(chartUI)
  dygraph.setSelection(row)

  ctx.save()
  ctx.beginPath()
  ctx.setLineDash(lineDashByFlavour[flavour])
  ctx.strokeStyle = chartUI.chart.getThemeAttribute(themeAttrByFlavour[flavour])
  ctx.moveTo(x, 0)
  ctx.lineTo(x, h)

  ctx.stroke()
  ctx.closePath()
  ctx.restore()

  if (
    flavour === "hover" &&
    dimensionId &&
    isHeatmap(chartUI.chart) &&
    chartUI.chart.getAttribute("heatmapHoverCell")
  )
    outlineHoveredCell(chartUI, dygraph, ctx, row, dimensionId)
}
