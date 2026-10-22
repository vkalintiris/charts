export const getHeatmapCellWidth = (g, points = []) => {
  let minSep = Infinity
  for (let i = 1; i < points.length; i++) {
    const sep = points[i].canvasx - points[i - 1].canvasx
    if (sep > 0 && sep < minSep) minSep = sep
  }

  return Number.isFinite(minSep) ? Math.floor(minSep) : g.getArea().w
}

export default (g, points) => {
  const width = getHeatmapCellWidth(g, points)
  const height = Math.abs(g.toDomYCoord(1) - g.toDomYCoord(0))

  return (canvasx, yIndex) => ({
    x: canvasx - width / 2,
    y: g.toDomYCoord(yIndex) - height / 2,
    width,
    height,
  })
}
