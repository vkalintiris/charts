import getPxRatio from "./pxRatio"

const fitGap = (size, gap) => (size >= 2 * gap + 1 ? gap : 0)

export default (self, { gap = 0 } = {}) => {
  const xs = self.data[0] || []

  let minSep = Infinity
  for (let i = 1; i < xs.length; i++) {
    const sep = self.valToPos(xs[i], "x", true) - self.valToPos(xs[i - 1], "x", true)
    if (sep > 0 && sep < minSep) minSep = sep
  }

  const width = Number.isFinite(minSep) ? Math.floor(minSep) : self.bbox.width
  const height = Math.abs(self.valToPos(1, "y", true) - self.valToPos(0, "y", true))
  const gapPx = gap * getPxRatio()
  const gapX = fitGap(width, gapPx)
  const gapY = fitGap(height, gapPx)

  return (x, yIndex) => {
    const centerX = self.valToPos(x, "x", true)
    const centerY = self.valToPos(yIndex, "y", true)
    const left = Math.round(centerX - width / 2 + gapX / 2)
    const right = Math.round(centerX + width / 2 - gapX / 2)
    const top = Math.round(centerY - height / 2 + gapY / 2)
    const bottom = Math.round(centerY + height / 2 - gapY / 2)

    return { x: left, y: top, width: right - left, height: bottom - top }
  }
}
