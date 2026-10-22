import makeHeatmapCell, { getHeatmapCellWidth } from "./heatmapCell"

const g = {
  toDomYCoord: index => 200 - index * 20,
  getArea: () => ({ x: 0, y: 0, w: 400, h: 200 }),
}

describe("dygraph heatmap cell", () => {
  it("is as wide as the narrowest column spacing", () => {
    const points = [{ canvasx: 10 }, { canvasx: 30 }, { canvasx: 45 }, { canvasx: 70 }]
    expect(getHeatmapCellWidth(g, points)).toBe(15)
  })

  it("spans the plot area when there is a single column", () => {
    expect(getHeatmapCellWidth(g, [{ canvasx: 10 }])).toBe(400)
    expect(getHeatmapCellWidth(g, [])).toBe(400)
  })

  it("centres the cell on its column and its row", () => {
    const getCell = makeHeatmapCell(g, [{ canvasx: 10 }, { canvasx: 30 }])
    expect(getCell(30, 2)).toEqual({ x: 20, y: 150, width: 20, height: 20 })
  })
})
