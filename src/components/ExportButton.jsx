function inlineCSSVars(clone, source) {
  const computed = getComputedStyle(source);
  const walk = (cloneEl, srcEl) => {
    if (cloneEl.nodeType !== 1) return;
    const attrs = ["fill", "stroke", "color", "stop-color"];
    for (const attr of attrs) {
      const val = cloneEl.getAttribute(attr);
      if (val && val.startsWith("var(")) {
        const prop = val.match(/var\(([^)]+)\)/)?.[1];
        if (prop) cloneEl.setAttribute(attr, computed.getPropertyValue(prop).trim());
      }
    }
    const children = cloneEl.children;
    const srcChildren = srcEl.children;
    for (let i = 0; i < children.length && i < srcChildren.length; i++) {
      walk(children[i], srcChildren[i]);
    }
  };
  walk(clone, source);
}

export default function ExportButton({ containerSelector, theme }) {
  const handleExport = async () => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const svg = container.querySelector("svg");
    if (!svg) return;

    const clone = svg.cloneNode(true);
    const width = +svg.getAttribute("width") || svg.clientWidth;
    const height = +svg.getAttribute("height") || svg.clientHeight;

    const bgColor = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    const textDimColor = getComputedStyle(document.documentElement).getPropertyValue("--text-dim").trim();
    const stripeColor = getComputedStyle(document.documentElement).getPropertyValue("--stripe").trim();

    // Inline computed styles for export
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.style.background = bgColor;

    // Resolve CSS custom properties so exported SVG renders correctly
    inlineCSSVars(clone, svg);

    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Extra space for branding bar
    const barHeight = 36;
    const canvas = document.createElement("canvas");
    const scale = 2; // retina
    canvas.width = width * scale;
    canvas.height = (height + barHeight) * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    const img = new Image();
    img.onload = () => {
      // Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height + barHeight);

      // Top accent stripe
      ctx.fillStyle = stripeColor;
      ctx.fillRect(0, 0, width, 3);

      // Chart
      ctx.drawImage(img, 0, 3, width, height);
      URL.revokeObjectURL(url);

      // Branding bar at bottom
      ctx.fillStyle = stripeColor;
      ctx.fillRect(0, height + 3, width, 1);
      ctx.font = "bold 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = accentColor;
      ctx.fillText("Mortgage Viz", 12, height + barHeight - 10);
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.fillStyle = textDimColor;
      const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      ctx.fillText(dateStr, width - ctx.measureText(dateStr).width - 12, height + barHeight - 10);

      canvas.toBlob((pngBlob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(pngBlob);
        a.download = "mortgage-viz.png";
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.src = url;
  };

  return (
    <button className="export-btn" onClick={handleExport} title="Export heatmap as PNG">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 11v3h12v-3" />
        <path d="M8 2v8" />
        <path d="M5 7l3 3 3-3" />
      </svg>
      PNG
    </button>
  );
}
