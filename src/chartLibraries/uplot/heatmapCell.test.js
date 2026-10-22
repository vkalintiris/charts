import makeHeatmapCell from "./heatmapCell"

const makeSelf = xs => ({
  data: [xs],
  bbox: { left: 0, top: 0, width: 800, height: 400 },
  valToPos: (value, scale) => (scale === "x" ? value * 2 : 400 - (value + 0.5) * 40),
})

describe("uplot heatmap cell", () => {
  it("is as wide as the narrowest column spacing and one row tall", () => {
    const getCell = makeHeatmapCell(makeSelf([10, 20, 25, 40]))
    expect(getCell(20, 1)).toEqual({ x: 35, y: 320, width: 10, height: 40 })
  })

  it("spans the plot when there is a single column", () => {
    const getCell = makeHeatmapCell(makeSelf([10]))
    expect(getCell(10, 0).width).toBe(800)
  })
})
