import Dygraph from "dygraphs/src/dygraph"
import linePlotter from "./linePlotter"

const makeContext = () => {
  const calls = []
  const drawingContext = {}

  ;["beginPath", "moveTo", "bezierCurveTo", "stroke", "save", "restore"].forEach(method => {
    drawingContext[method] = (...args) => calls.push([method, ...args])
  })

  return { calls, drawingContext }
}

const makeDygraph = calls => ({
  getOption: name =>
    name === "drawPointCallback"
      ? (g, setName, ctx, x, y, color, radius) => calls.push(["point", x, y, color, radius])
      : undefined,
  getNumericOption: name => (name === "pointSize" ? 1 : undefined),
})

const plot = (points, context) =>
  linePlotter()({
    dygraph: makeDygraph(context.calls),
    setName: "p99",
    color: "#123456",
    drawingContext: context.drawingContext,
    points,
  })

// The curve matches Dygraph's smooth plotter call for call; isolated points are drawn after it.
const expectSameDrawing = (points, smoothing) => {
  const previousSmoothing = Dygraph.smoothPlotter.smoothing
  const reference = makeContext()
  const candidate = makeContext()

  try {
    Dygraph.smoothPlotter.smoothing = smoothing
    Dygraph.smoothPlotter({ drawingContext: reference.drawingContext, points })
    plot(points, candidate)
  } finally {
    Dygraph.smoothPlotter.smoothing = previousSmoothing
  }

  expect(candidate.calls.slice(0, reference.calls.length)).toEqual(reference.calls)
  candidate.calls
    .slice(reference.calls.length)
    .forEach(([method]) => expect(["save", "point", "restore"]).toContain(method))
}

describe("linePlotter", () => {
  it("returns a function", () => {
    const plotter = linePlotter()
    expect(typeof plotter).toBe("function")
  })

  it.each([
    {
      name: "continuous points",
      points: [
        { canvasx: 10, canvasy: 40 },
        { canvasx: 20, canvasy: 10 },
        { canvasx: 30, canvasy: 60 },
        { canvasx: 40, canvasy: 20 },
      ],
    },
    {
      name: "missing and zero-height points",
      points: [
        { canvasx: 10, canvasy: 40 },
        { canvasx: 20, canvasy: null },
        { canvasx: 30, canvasy: 20 },
        { canvasx: 40, canvasy: 0 },
        { canvasx: 50, canvasy: 30 },
        { canvasx: 60, canvasy: NaN },
      ],
    },
    {
      name: "two points",
      points: [
        { canvasx: 10, canvasy: 40 },
        { canvasx: 20, canvasy: 10 },
      ],
    },
  ])("matches the Dygraph smooth plotter for $name", ({ points }) => {
    expectSameDrawing(points, Dygraph.smoothPlotter.smoothing)
  })

  it.each([undefined, 0, 0.2, 1 / 3, 0.8])(
    "matches the Dygraph smooth plotter with smoothing %s",
    smoothing => {
      const values = [10, 90, -20, 60, 5, 120, 0, null, 40, NaN, 80, 15, Infinity, 30]
      const points = Array.from({ length: 140 }, (_, index) => ({
        canvasx: index % 17 === 0 ? index - 1 : index,
        canvasy: values[index % values.length],
      }))

      expectSameDrawing(points, smoothing)
    }
  )

  it("draws a point for each value with no valid neighbour", () => {
    const context = makeContext()
    plot(
      [
        { canvasx: 10, canvasy: 40 },
        { canvasx: 20, canvasy: null },
        { canvasx: 30, canvasy: 20 },
        { canvasx: 40, canvasy: NaN },
        { canvasx: 50, canvasy: 30 },
        { canvasx: 60, canvasy: 35 },
      ],
      context
    )

    expect(context.calls.filter(([method]) => method === "point")).toEqual([
      ["point", 10, 40, "#123456", 1],
      ["point", 30, 20, "#123456", 1],
    ])
  })

  it("draws no points when every value has a neighbour", () => {
    const context = makeContext()
    plot(
      [
        { canvasx: 10, canvasy: 40 },
        { canvasx: 20, canvasy: 10 },
        { canvasx: 30, canvasy: null },
        { canvasx: 40, canvasy: 20 },
        { canvasx: 50, canvasy: 30 },
      ],
      context
    )

    expect(context.calls.filter(([method]) => method === "point")).toEqual([])
  })
})
