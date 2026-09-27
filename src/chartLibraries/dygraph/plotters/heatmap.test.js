import heatmapPlotter from "./heatmap"
import { makeTestChart } from "@jest/testUtilities"

describe("heatmap plotter", () => {
  let chartUI
  let plotter
  let ctx

  beforeEach(() => {
    const { chart } = makeTestChart({
      attributes: {
        chartType: "heatmap",
        dimensionIds: ["dim1", "dim2", "dim3"],
      },
    })

    ctx = {
      fillStyle: "black",
      strokeStyle: "black",
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
    }

    plotter = {
      seriesIndex: 0,
      drawingContext: ctx,
      allSeriesPoints: [
        [{ canvasx: 10 }, { canvasx: 20 }, { canvasx: 30 }],
        [{ canvasx: 15 }, { canvasx: 25 }, { canvasx: 35 }],
        [{ canvasx: 18 }, { canvasx: 28 }, { canvasx: 38 }],
      ],
      dygraph: {
        layout_: {
          setNames: ["dim1", "dim2", "dim3"],
        },
        toDomYCoord: jest.fn(index => 50 + index * 20),
        toDomXCoord: jest.fn(x => x / 1000),
      },
    }

    chartUI = {
      chart: chart,
    }

    jest.spyOn(chart, "getVisibleDimensionIds").mockReturnValue(["dim1", "dim2", "dim3"])
    jest.spyOn(chart, "getDimensionIndex").mockImplementation(name => {
      const map = { dim1: 0, dim2: 1, dim3: 2 }
      return map[name] ?? -1
    })
    jest.spyOn(chart, "getHeatmapYIndex").mockImplementation(name => chart.getDimensionIndex(name))
    jest.spyOn(chart, "getDimensionValue").mockReturnValue(42)
    jest.spyOn(chart, "getAttribute").mockImplementation(attr => {
      if (attr === "max") return 100
      return undefined
    })
  })

  it("returns early if no chartUI", () => {
    const plotterFunc = heatmapPlotter(null)
    expect(() => plotterFunc(plotter)).not.toThrow()
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it("returns early if seriesIndex is not 0", () => {
    plotter.seriesIndex = 1
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it("renders heatmap rectangles for visible dimensions", () => {
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)

    expect(ctx.fillRect).toHaveBeenCalled()
    expect(ctx.strokeRect).toHaveBeenCalled()
  })

  it("calculates bar width from minimum separation", () => {
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)

    expect(ctx.fillRect).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      10,
      expect.any(Number)
    )
  })

  it("skips series with unknown dimension index", () => {
    chartUI.chart.getHeatmapYIndex.mockReturnValue(-1)
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)

    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it("draws rows using sorted heatmap y-index while reading values by series id", () => {
    plotter.allSeriesPoints = [
      [{ canvasx: 10 }, { canvasx: 20 }],
      [{ canvasx: 10 }, { canvasx: 20 }],
      [{ canvasx: 10 }, { canvasx: 20 }],
    ]
    plotter.dygraph.layout_.setNames = ["+Inf", "0.3", "2"]
    plotter.dygraph.toDomYCoord = jest.fn(index => 50 + index * 20)

    chartUI.chart.getHeatmapYIndex.mockImplementation(id => {
      const indexes = { 0.3: 0, 2: 1, "+Inf": 2 }
      return indexes[id] ?? -1
    })
    chartUI.chart.getDimensionValue.mockImplementation(id => {
      const values = { 0.3: 1, 2: 2, "+Inf": 3 }
      return values[id]
    })

    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)

    expect(ctx.fillRect.mock.calls[0][1]).toBe(80)
    expect(ctx.fillRect.mock.calls[2][1]).toBe(40)
    expect(ctx.fillRect.mock.calls[4][1]).toBe(60)
    expect(chartUI.chart.getDimensionValue).toHaveBeenCalledWith("+Inf", 0, { allowNull: true })
    expect(chartUI.chart.getDimensionValue).toHaveBeenCalledWith("0.3", 0, { allowNull: true })
    expect(chartUI.chart.getDimensionValue).toHaveBeenCalledWith("2", 0, { allowNull: true })
  })

  it("reads values by dygraph payload row index when points are clipped", () => {
    plotter.allSeriesPoints = [
      [
        { canvasx: 10, idx: 4 },
        { canvasx: 20, idx: 5 },
      ],
    ]
    plotter.dygraph.layout_.setNames = ["dim1"]

    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)

    expect(chartUI.chart.getDimensionValue).toHaveBeenCalledWith("dim1", 4, { allowNull: true })
    expect(chartUI.chart.getDimensionValue).toHaveBeenCalledWith("dim1", 5, { allowNull: true })
  })

  it("uses color based on dimension value", () => {
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)

    expect(ctx.fillStyle).toContain("rgb(")
    expect(ctx.strokeStyle).toBe("transparent")
  })

  it("calculates height based on series position", () => {
    plotter.dygraph.toDomYCoord = jest.fn(index => {
      if (index === 0) return 50
      if (index === 1) return 70
      if (index === 2) return 90
      return 110
    })

    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)

    expect(ctx.fillRect).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      20
    )
  })

  it("handles empty allSeriesPoints", () => {
    plotter.allSeriesPoints = []
    plotter.dygraph.layout_.setNames = []
    const plotterFunc = heatmapPlotter(chartUI)
    expect(() => plotterFunc(plotter)).not.toThrow()
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it("handles two data points", () => {
    plotter.allSeriesPoints = [[{ canvasx: 10 }, { canvasx: 110 }]]
    plotter.dygraph.layout_.setNames = ["dim1"]
    const plotterFunc = heatmapPlotter(chartUI)
    plotterFunc(plotter)

    expect(ctx.fillRect).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      100,
      expect.any(Number)
    )
  })

  it("draws no markers unless asked", () => {
    heatmapPlotter(chartUI)(plotter)
    expect(ctx.arc).not.toHaveBeenCalled()
  })

  it("draws a marker at each marked column and row, skipping unknown rows", () => {
    chartUI.chart.getAttribute.mockImplementation(attr => {
      if (attr === "max") return 100
      if (attr === "heatmapMarkers")
        return [
          { x: 10_000, id: "dim3" },
          { x: 20_000, id: "dim1" },
          { x: 30_000, id: "missing" },
        ]
      return undefined
    })

    heatmapPlotter(chartUI)(plotter)

    expect(ctx.arc.mock.calls.map(([x, y]) => [x, y])).toEqual([
      [10, 90],
      [20, 50],
    ])
  })

  it("lays slotted markers side by side in the cell, colored with a white outline", () => {
    chartUI.chart.getAttribute.mockImplementation(attr => {
      if (attr === "max") return 100
      if (attr === "heatmapMarkers")
        return [
          { x: 20_000, id: "dim1", color: "#0000ff", slot: 0, slots: 3 },
          { x: 20_000, id: "dim1", color: "#ff0000", slot: 1, slots: 3 },
          { x: 20_000, id: "dim2", color: "#00ff00", slot: 2, slots: 3 },
        ]
      return undefined
    })
    const fills = []
    ctx.fill.mockImplementation(() => fills.push([ctx.fillStyle, ctx.strokeStyle, ctx.lineWidth]))

    heatmapPlotter(chartUI)(plotter)

    // bar width 10 (the column spacing), three places of 10/3 px each
    const place = 10 / 3
    expect(ctx.arc.mock.calls.map(([x, y, r]) => [x, y, r])).toEqual([
      [20 - place, 50, place / 2 - 0.25],
      [20, 50, place / 2 - 0.25],
      [20 + place, 70, place / 2 - 0.25],
    ])
    expect(fills).toEqual([
      ["#0000ff", "#ffffff", 0.5],
      ["#ff0000", "#ffffff", 0.5],
      ["#00ff00", "#ffffff", 0.5],
    ])
  })
})
