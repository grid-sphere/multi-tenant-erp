/**
 * Tool definitions shared by the palette and the annotation layer.
 *
 * `stamp` tools drop a fixed glyph on click. `drag` tools sample a path while
 * the pointer is down. `box` tools drag out a rectangle. Keeping the behaviour
 * class on the definition means the layer switches on one field rather than
 * carrying a branch per tool.
 */

export const TOOL_SELECT = "select";

export const TOOLS = [
  {
    id: "select",
    behaviour: "select",
    label: "Select",
    icon: "arrow_selector_tool",
    shortcut: "v",
  },
  {
    id: "tick",
    behaviour: "stamp",
    kind: "tick",
    label: "Tick",
    icon: "check",
    shortcut: "1",
    color: "#15803d",
  },
  {
    id: "cross",
    behaviour: "stamp",
    kind: "cross",
    label: "Cross",
    icon: "close",
    shortcut: "2",
    color: "#b91c1c",
  },
  {
    id: "half",
    behaviour: "stamp",
    kind: "half",
    label: "Half mark",
    icon: "change_history",
    shortcut: "3",
    color: "#b45309",
  },
  {
    id: "comment",
    behaviour: "stamp",
    kind: "comment",
    label: "Comment",
    icon: "chat_bubble",
    shortcut: "4",
    color: "#0f766e",
    prompt: true,
  },
  {
    id: "ink",
    behaviour: "drag",
    kind: "ink",
    label: "Pen",
    icon: "edit",
    shortcut: "5",
    color: "#b91c1c",
    strokeWidth: 2.5,
  },
  {
    id: "highlight",
    behaviour: "drag",
    kind: "highlight",
    label: "Highlighter",
    icon: "ink_highlighter",
    shortcut: "6",
    color: "#facc15",
    strokeWidth: 14,
    opacity: 0.35,
  },
  {
    id: "text",
    behaviour: "box",
    kind: "text",
    label: "Text box",
    icon: "text_fields",
    shortcut: "7",
    color: "#b91c1c",
    prompt: true,
  },
];

export const TOOL_BY_ID = TOOLS.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});

export const SHORTCUT_TO_TOOL = TOOLS.reduce((acc, t) => {
  if (t.shortcut) acc[t.shortcut] = t.id;
  return acc;
}, {});

/** Stamps are drawn at a fixed on-screen size, expressed as a fraction of page width. */
export const STAMP_SIZE = 0.035;

export const STAMP_GLYPH = {
  tick: "✓",
  cross: "✗",
  half: "½",
  comment: "✎",
};
