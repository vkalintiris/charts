import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import Dimension from "./dimension"

const renderHidden = legendKeepValueRow => {
  const { chart } = makeTestChart({
    attributes: {
      legendKeepValueRow,
      viewDimensions: { ids: ["a"], names: ["a"], units: [""], contexts: ["test"] },
      dimensionIds: ["a"],
    },
  })
  chart.isDimensionVisible = () => false
  renderWithChart(<Dimension id="a" />, { chart })
}

describe("legend Dimension", () => {
  it("keeps an empty value line for a hidden dimension with legendKeepValueRow", () => {
    renderHidden(true)

    expect(screen.getByTestId("chartLegendDimension-valuePlaceholder")).toBeInTheDocument()
  })

  it("drops the value line of a hidden dimension by default", () => {
    renderHidden(false)

    expect(screen.queryByTestId("chartLegendDimension-valuePlaceholder")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartLegendDimension-valueContainer")).toBeEmptyDOMElement()
  })
})
