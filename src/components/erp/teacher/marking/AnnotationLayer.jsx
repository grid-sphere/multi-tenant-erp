import React, { useCallback, useRef, useState } from "react";
import { STAMP_GLYPH, STAMP_SIZE, TOOL_BY_ID, TOOL_SELECT } from "./annotationTools";

/**
 * SVG overlay sitting exactly on top of the rendered page.
 *
 * SVG rather than a second canvas: annotations have to stay individually
 * selectable, movable and deletable. Painting them into a canvas would mean
 * re-rendering everything on each edit and hand-rolling hit-testing, whereas
 * SVG nodes get that from the browser and scale crisply at any zoom.
 *
 * Everything here works in normalised 0..1 page space and multiplies by the
 * rendered size only at draw time, so the same annotation lands in the same
 * place regardless of zoom, DPI or window size.
 */
export default function AnnotationLayer({
  width,
  height,
  page,
  annotations,
  activeTool,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
}) {
  const svgRef = useRef(null);
  const [draft, setDraft] = useState(null); // in-progress ink/box
  const dragRef = useRef(null); // moving an existing annotation

  const tool = TOOL_BY_ID[activeTool] || TOOL_BY_ID[TOOL_SELECT];
  const pageAnnotations = annotations.filter((a) => a.page === page);

  /** Pointer position as a 0..1 fraction of the page box. */
  const toNormalised = useCallback((event) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }, []);

  // -- creating -----------------------------------------------------------

  const handlePointerDown = (event) => {
    if (disabled || tool.behaviour === "select") return;
    if (event.button !== 0) return;
    event.preventDefault();
    const point = toNormalised(event);
    svgRef.current.setPointerCapture(event.pointerId);

    if (tool.behaviour === "stamp") {
      let payload = { color: tool.color };
      if (tool.prompt) {
        const text = window.prompt(`${tool.label}:`);
        if (text === null || text.trim() === "") {
          svgRef.current.releasePointerCapture(event.pointerId);
          return;
        }
        payload = { ...payload, text: text.trim() };
      }
      onAdd({
        page,
        kind: tool.kind,
        x: point.x,
        y: point.y,
        w: 0,
        h: 0,
        payload,
      });
      svgRef.current.releasePointerCapture(event.pointerId);
      return;
    }

    if (tool.behaviour === "drag") {
      setDraft({ type: "path", points: [[point.x, point.y]] });
    } else if (tool.behaviour === "box") {
      setDraft({ type: "box", start: point, current: point });
    }
  };

  const handlePointerMove = (event) => {
    if (dragRef.current) {
      const point = toNormalised(event);
      const { id, offsetX, offsetY } = dragRef.current;
      onUpdate(
        id,
        {
          x: Math.min(1, Math.max(0, point.x - offsetX)),
          y: Math.min(1, Math.max(0, point.y - offsetY)),
        },
        // Don't push an undo entry per pointermove — one entry per drag,
        // recorded when the drag started.
        { record: false }
      );
      return;
    }
    if (!draft) return;

    const point = toNormalised(event);
    if (draft.type === "path") {
      setDraft((d) => {
        const last = d.points[d.points.length - 1];
        // Skip sub-pixel samples; a 60Hz pointer generates far more points
        // than the stroke needs and they all get stored.
        if (Math.hypot(point.x - last[0], point.y - last[1]) < 0.002) return d;
        return { ...d, points: [...d.points, [point.x, point.y]] };
      });
    } else {
      setDraft((d) => ({ ...d, current: point }));
    }
  };

  const handlePointerUp = (event) => {
    if (dragRef.current) {
      dragRef.current = null;
      return;
    }
    if (!draft) return;
    svgRef.current.releasePointerCapture?.(event.pointerId);

    if (draft.type === "path") {
      const { points } = draft;
      if (points.length >= 2) {
        const xs = points.map((p) => p[0]);
        const ys = points.map((p) => p[1]);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        onAdd({
          page,
          kind: tool.kind,
          x,
          y,
          w: Math.max(...xs) - x,
          h: Math.max(...ys) - y,
          payload: {
            points,
            color: tool.color,
            strokeWidth: tool.strokeWidth,
            opacity: tool.opacity,
          },
        });
      }
    } else if (draft.type === "box") {
      const { start, current } = draft;
      const x = Math.min(start.x, current.x);
      const y = Math.min(start.y, current.y);
      const w = Math.abs(current.x - start.x);
      const h = Math.abs(current.y - start.y);
      if (w > 0.01 && h > 0.01) {
        const text = window.prompt(`${tool.label}:`);
        if (text !== null && text.trim() !== "") {
          onAdd({
            page,
            kind: tool.kind,
            x,
            y,
            w,
            h,
            payload: { text: text.trim(), color: tool.color },
          });
        }
      }
    }
    setDraft(null);
  };

  // -- moving -------------------------------------------------------------

  const startDrag = (event, annotation) => {
    if (disabled || tool.behaviour !== "select") return;
    event.stopPropagation();
    onSelect(annotation.id);
    const point = toNormalised(event);
    // Record one undo entry for the whole drag, before anything moves.
    onUpdate(annotation.id, {}, { record: true });
    dragRef.current = {
      id: annotation.id,
      offsetX: point.x - annotation.x,
      offsetY: point.y - annotation.y,
    };
    svgRef.current.setPointerCapture(event.pointerId);
  };

  const cursor =
    disabled || tool.behaviour === "select" ? "default" : "crosshair";

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0"
      style={{ cursor, touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDraft(null)}
      role="application"
      aria-label={`Annotation layer for page ${page + 1}`}
    >
      {pageAnnotations.map((a) => (
        <AnnotationNode
          key={a.id}
          annotation={a}
          width={width}
          height={height}
          selected={a.id === selectedId}
          selectable={tool.behaviour === "select" && !disabled}
          onPointerDown={(e) => startDrag(e, a)}
          onRemove={() => onRemove(a.id)}
        />
      ))}

      {draft?.type === "path" && (
        <polyline
          points={draft.points.map(([x, y]) => `${x * width},${y * height}`).join(" ")}
          fill="none"
          stroke={tool.color}
          strokeWidth={tool.strokeWidth}
          strokeOpacity={tool.opacity ?? 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {draft?.type === "box" && (
        <rect
          x={Math.min(draft.start.x, draft.current.x) * width}
          y={Math.min(draft.start.y, draft.current.y) * height}
          width={Math.abs(draft.current.x - draft.start.x) * width}
          height={Math.abs(draft.current.y - draft.start.y) * height}
          fill="none"
          stroke={tool.color}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}
    </svg>
  );
}

function AnnotationNode({
  annotation,
  width,
  height,
  selected,
  selectable,
  onPointerDown,
  onRemove,
}) {
  const { kind, x, y, w, h, payload = {} } = annotation;
  const px = x * width;
  const py = y * height;
  const color = payload.color || "#b91c1c";
  const cursor = selectable ? "move" : "default";

  const selectionRing = selected && (
    <rect
      x={px - 4}
      y={py - 4}
      width={Math.max(w * width, STAMP_SIZE * width) + 8}
      height={Math.max(h * height, STAMP_SIZE * width) + 8}
      fill="none"
      stroke="#0f766e"
      strokeWidth={1.5}
      strokeDasharray="4 3"
      pointerEvents="none"
    />
  );

  const deleteHandle = selected && (
    <g
      transform={`translate(${px + Math.max(w * width, STAMP_SIZE * width) + 6}, ${py - 6})`}
      style={{ cursor: "pointer" }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onRemove();
      }}
    >
      <circle r={8} fill="#b91c1c" />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fill="#ffffff"
        style={{ userSelect: "none" }}
      >
        ×
      </text>
    </g>
  );

  if (kind === "ink" || kind === "highlight") {
    const points = (payload.points || [])
      .map(([nx, ny]) => `${nx * width},${ny * height}`)
      .join(" ");
    return (
      <g onPointerDown={onPointerDown} style={{ cursor }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={payload.strokeWidth || 2.5}
          strokeOpacity={payload.opacity ?? 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Invisible fat stroke so thin ink is still easy to grab */}
        <polyline
          points={points}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(payload.strokeWidth || 2.5, 12)}
          strokeLinecap="round"
        />
        {selectionRing}
        {deleteHandle}
      </g>
    );
  }

  if (kind === "text") {
    const boxW = w * width;
    const boxH = h * height;
    return (
      <g onPointerDown={onPointerDown} style={{ cursor }}>
        <rect
          x={px}
          y={py}
          width={boxW}
          height={boxH}
          fill="#ffffff"
          fillOpacity={0.9}
          stroke={color}
          strokeWidth={1.5}
          rx={4}
        />
        <foreignObject x={px + 4} y={py + 3} width={Math.max(0, boxW - 8)} height={Math.max(0, boxH - 6)}>
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              font: "12px Inter, system-ui, sans-serif",
              color,
              lineHeight: 1.3,
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {payload.text}
          </div>
        </foreignObject>
        {selectionRing}
        {deleteHandle}
      </g>
    );
  }

  // Stamps: tick, cross, half, comment
  const size = STAMP_SIZE * width;
  const glyph = STAMP_GLYPH[kind] || "•";

  return (
    <g onPointerDown={onPointerDown} style={{ cursor }}>
      <text
        x={px}
        y={py}
        fontSize={size}
        fill={color}
        fontWeight="700"
        dominantBaseline="central"
        style={{ userSelect: "none" }}
      >
        {glyph}
      </text>

      {kind === "comment" && payload.text && (
        <g transform={`translate(${px + size * 0.9}, ${py - size * 0.55})`}>
          <rect
            width={Math.min(220, 7 * payload.text.length + 14)}
            height={22}
            rx={4}
            fill="#ffffff"
            fillOpacity={0.95}
            stroke={color}
            strokeWidth={1}
          />
          <text
            x={7}
            y={11}
            fontSize={11}
            fill={color}
            dominantBaseline="central"
            style={{ userSelect: "none" }}
          >
            {payload.text.length > 30
              ? `${payload.text.slice(0, 30)}…`
              : payload.text}
          </text>
        </g>
      )}

      {/* Generous hit target — the glyph itself is thin */}
      <rect
        x={px - size * 0.2}
        y={py - size * 0.6}
        width={size * 1.2}
        height={size * 1.2}
        fill="transparent"
      />
      {selectionRing}
      {deleteHandle}
    </g>
  );
}
