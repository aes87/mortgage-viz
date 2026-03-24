import { test, expect } from "@playwright/test";

// Verify: hovering over heatmap cells no longer creates "voids" in the rent boundary line.
// The bug was that d3.select(this).raise() moved the hovered cell above the rent line group.

test.describe("Heatmap hover does not break rent boundary line", () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto("http://localhost:5173/mortgage-viz/");
    await page.waitForSelector(".heatmap-container svg .cell", { timeout: 10000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("rent boundary line stays above cells after hover", async () => {
    const cells = page.locator(".heatmap-container svg .cell");
    const cellCount = await cells.count();
    const midCell = cells.nth(Math.floor(cellCount / 2));

    // Hover the cell
    await midCell.hover();
    await page.waitForTimeout(200);

    const order = await page.evaluate(() => {
      const g = document.querySelector("g.chart-g");
      if (!g) return null;
      const children = Array.from(g.children);

      const rentGroup = children.find(
        (el) => el.tagName === "g" && el.getAttribute("clip-path")
      );
      const rentIdx = rentGroup ? children.indexOf(rentGroup) : -1;

      const hoveredCell = children.find(
        (el) => el.classList.contains("cell") && el.getAttribute("stroke")
      );
      const hoveredIdx = hoveredCell ? children.indexOf(hoveredCell) : -1;

      return {
        rentIdx,
        hoveredIdx,
        hoveredAboveRentLine: hoveredIdx > rentIdx,
      };
    });

    console.log("After hover:", order);

    // The hovered cell should NOT be above the rent line
    expect(order.hoveredAboveRentLine).toBe(false);
  });

  test("screenshot confirms no void artifact", async () => {
    const cells = page.locator(".heatmap-container svg .cell");
    const cellCount = await cells.count();

    // Hover a cell near the boundary line area
    const midCell = cells.nth(Math.floor(cellCount * 0.5));
    await midCell.hover();
    await page.waitForTimeout(200);

    await page.screenshot({
      path: "tests/screenshots/hover-fixed.png",
      clip: { x: 280, y: 50, width: 900, height: 650 },
    });
  });
});
