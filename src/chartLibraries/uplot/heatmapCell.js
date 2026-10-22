export default self => {
  const xs = self.data[0] || []

  let minSep = Infinity
  for (let i = 1; i < xs.length; i++) {
    const sep = self.valToPos(xs[i], "x", true) - self.valToPos(xs[i - 1], "x", true)
    if (sep > 0 && sep < minSep) minSep = sep
  }

  const width = Number.isFinite(minSep) ? Math.floor(minSep) : self.bbox.width
  const height = Math.abs(self.valToPos(1, "y", true) - self.valToPos(0, "y", true))

  return (x, yIndex) => ({
    x: self.valToPos(x, "x", true) - width / 2,
    y: self.valToPos(yIndex, "y", true) - height / 2,
    width,
    height,
  })
}
