import Dygraph from "dygraphs/src/dygraph"
import "dygraphs/src/extras/smooth-plotter"
import { Circles } from "dygraphs/src/dygraph-utils"

const isValidPoint = point => point && point.canvasy && !isNaN(point.canvasy)

// A value with no valid neighbour gets no curve segment, so it is drawn as a point, as Dygraph's
// own line plotter does; otherwise a lone value between gaps would not show at all.
const drawIsolatedPoints = ({ dygraph, setName, drawingContext, points, color }) => {
  let drawPoint = null
  let pointSize

  for (let index = 0; index < points.length; index++) {
    const point = points[index]
    if (!isValidPoint(point)) continue
    if (isValidPoint(points[index - 1]) || isValidPoint(points[index + 1])) continue

    if (!drawPoint) {
      drawPoint = dygraph.getOption("drawPointCallback", setName) || Circles.DEFAULT
      pointSize = dygraph.getNumericOption("pointSize", setName)
    }

    drawingContext.save()
    drawPoint.call(
      dygraph,
      dygraph,
      setName,
      drawingContext,
      point.canvasx,
      point.canvasy,
      color,
      pointSize,
      point.idx
    )
    drawingContext.restore()
  }
}

const smoothLinePlotter = e => {
  const { drawingContext, points } = e

  drawingContext.beginPath()
  drawingContext.moveTo(points[0].canvasx, points[0].canvasy)

  let lastRightX = points[0].canvasx
  let lastRightY = points[0].canvasy
  const configuredSmoothing = Dygraph.smoothPlotter.smoothing
  const alpha = configuredSmoothing === undefined ? 1 / 3 : configuredSmoothing

  for (let index = 1; index < points.length; index++) {
    const previous = isValidPoint(points[index - 1]) ? points[index - 1] : null
    const point = isValidPoint(points[index]) ? points[index] : null
    const next = isValidPoint(points[index + 1]) ? points[index + 1] : null

    if (previous && point) {
      let leftX
      let leftY
      let rightX
      let rightY

      if (!next) {
        leftX = point.canvasx
        leftY = point.canvasy
        rightX = null
        rightY = null
      } else {
        leftX = (1 - alpha) * point.canvasx + alpha * previous.canvasx
        leftY = (1 - alpha) * point.canvasy + alpha * previous.canvasy
        rightX = (1 - alpha) * point.canvasx + alpha * next.canvasx
        rightY = (1 - alpha) * point.canvasy + alpha * next.canvasy

        if (leftX != rightX) {
          const deltaY =
            point.canvasy -
            rightY -
            ((point.canvasx - rightX) * (leftY - rightY)) / (leftX - rightX)
          leftY += deltaY
          rightY += deltaY
        }

        if (leftY > previous.canvasy && leftY > point.canvasy) {
          leftY = Math.max(previous.canvasy, point.canvasy)
          rightY = 2 * point.canvasy - leftY
        } else if (leftY < previous.canvasy && leftY < point.canvasy) {
          leftY = Math.min(previous.canvasy, point.canvasy)
          rightY = 2 * point.canvasy - leftY
        }

        if (rightY > point.canvasy && rightY > next.canvasy) {
          rightY = Math.max(point.canvasy, next.canvasy)
          leftY = 2 * point.canvasy - rightY
        } else if (rightY < point.canvasy && rightY < next.canvasy) {
          rightY = Math.min(point.canvasy, next.canvasy)
          leftY = 2 * point.canvasy - rightY
        }
      }

      lastRightX = lastRightX !== null ? lastRightX : previous.canvasx
      lastRightY = lastRightY !== null ? lastRightY : previous.canvasy
      drawingContext.bezierCurveTo(
        lastRightX,
        lastRightY,
        leftX,
        leftY,
        point.canvasx,
        point.canvasy
      )
      lastRightX = rightX
      lastRightY = rightY
    } else if (point) {
      drawingContext.moveTo(point.canvasx, point.canvasy)
      lastRightX = point.canvasx
      lastRightY = point.canvasy
    } else {
      lastRightX = null
      lastRightY = null
    }
  }

  drawingContext.stroke()
  drawIsolatedPoints(e)
}

export default () => smoothLinePlotter
