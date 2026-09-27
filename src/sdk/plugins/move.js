const getMoveX = (after, before = 0, autoPlay = true) => {
  if (after < 0) return { after, before }

  if (autoPlay && before > Math.ceil(Date.now() / 1000)) {
    return { after: Math.floor(after - before + 1), before: 0 }
  }

  return { after: Math.floor(after), before: Math.ceil(before) }
}

export default sdk => {
  let offAfter

  return sdk
    .on("moveX", (chart, after, before) => {
      const autoPlay = chart.getAttribute("autoPlay")
      const move = getMoveX(after, before, autoPlay)

      // A relative window is drawn back from `liveAnchor`; one left by an earlier fixed window would pin it there,
      // stuck in the past while paused. Anchor it at the move; the next live fetch advances it.
      const anchored = move.after < 0 ? { ...move, liveAnchor: Date.now() } : move

      chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
        node.updateAttributes(anchored)

        if (!node.getAttribute("active")) node.updateAttribute("loaded", false)
      })
    })
    .on("moveY", (chart, min, max) => {
      chart.updateStaticValueRange([min, max])
      const after = chart.getAttribute("after")

      if (after < 0) {
        const now = Date.now() / 1000 - 1
        chart.moveX(now + after, now)
      }

      if (offAfter) offAfter()
      offAfter = chart.onAttributeChange("after", after => {
        if (after > 0) return

        chart.resetStaticValueRange()
        offAfter()
      })
    })
}
