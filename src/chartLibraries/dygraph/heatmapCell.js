export const getHeatmapCellWidth = (g, points = []) => {
  let minSep = Infinity
  for (let i = 1; i < points.length; i++) {
    const sep = points[i].canvasx - points[i - 1].canvasx
    if (sep > 0 && sep < minSep) minSep = sep
  }

  return Number.isFinite(minSep) ? Math.floor(minSep) : g.getArea().w
}

const fitGap = (size, gap) => (size >= 2 * gap + 1 ? gap : 0)

const snap = (value, ratio) => Math.round(value * ratio) / ratio

export default (g, points, { gap = 0, ratio = window.devicePixelRatio || 1 } = {}) => {
  const width = getHeatmapCellWidth(g, points)
  const height = Math.abs(g.toDomYCoord(1) - g.toDomYCoord(0))
  const gapX = fitGap(width, gap)
  const gapY = fitGap(height, gap)

  return (canvasx, yIndex) => {
    const centerY = g.toDomYCoord(yIndex)
    const left = snap(canvasx - width / 2 + gapX / 2, ratio)
    const right = snap(canvasx + width / 2 - gapX / 2, ratio)
    const top = snap(centerY - height / 2 + gapY / 2, ratio)
    const bottom = snap(centerY + height / 2 - gapY / 2, ratio)

    return { x: left, y: top, width: right - left, height: bottom - top }
  }
}
