import type { JSX } from "react";
import { Tool } from "../models/tools";
import { DrawIcon, EllipseIcon, EraseIcon, FillIcon, LineIcon, RectangleIcon } from "./icons";

interface ToolPaletteProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const toolIcons: Record<Tool, { label: string; icon: JSX.Element }> = {
  [Tool.Draw]: {
    label: "Draw",
    icon: <DrawIcon />,
  },
  [Tool.Erase]: {
    label: "Erase",
    icon: <EraseIcon />,
  },
  [Tool.Line]: {
    label: "Line",
    icon: <LineIcon />,
  },
  [Tool.Rectangle]: {
    label: "Rectangle",
    icon: <RectangleIcon />,
  },
  [Tool.Ellipse]: {
    label: "Ellipse",
    icon: <EllipseIcon />,
  },
  [Tool.Fill]: {
    label: "Fill",
    icon: <FillIcon />,
  },
};

export function ToolPalette({ activeTool, onToolChange }: ToolPaletteProps) {
  return (
    <div className="tool-palette">
      {Object.values(Tool).map((tool) => {
        const { label, icon } = toolIcons[tool];
        const isActive = activeTool === tool;
        return (
          <button
            key={tool}
            className={`tool-btn${isActive ? " tool-btn-active" : ""}`}
            title={label}
            aria-label={label}
            onClick={() => onToolChange(tool)}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
