import React from "react"
import { act, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeHeatmapPayload, makeTestChart, renderWithChart } from "@jest/testUtilities"
import Popover from "@/components/line/popover"

const ids = ["1", "2", "3", "4", "5", "6"]

const showTooltip = async (attributes = {}, row = [1, 0, 3, 2, 0, 4], hovered = "3") => {
  const { chart } = makeTestChart({
    attributes: {
      designFlavour: "modern",
      chartType: "heatmap",
      groupBy: ["dimension"],
      selectedDimensions: [],
      selectedLegendDimensions: [],
      heatmapKeepEmptyRows: true,
      ...attributes,
    },
  })

  await act(async () => {
    chart.doneFetch(makeHeatmapPayload(ids, [row, row], { timestamp: 1000 }))
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  chart.updateAttribute("hoverX", [1000, hovered])
  renderWithChart(<Popover />, { chart })

  await act(async () => {
    chart.getUI().trigger("mousemove", { clientX: 100, clientY: 80 })
    await new Promise(resolve => window.requestAnimationFrame(() => resolve()))
  })

  return within(screen.getByTestId("modernTooltip")).getAllByTestId("modernTooltip-name")
}

describe("modern heatmap tooltip", () => {
  it("paints the hovered row's name in the hover colour", async () => {
    const names = await showTooltip({ heatmapHoverColor: "#F28E2B" })
    const hovered = names.find(name => name.textContent === "3")
    const other = names.find(name => name.textContent === "1")

    expect(window.getComputedStyle(hovered).color).toBe("rgb(242, 142, 43)")
    expect(window.getComputedStyle(other).color).not.toBe("rgb(242, 142, 43)")
  })
})
