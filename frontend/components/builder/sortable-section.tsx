"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type DragAttributes = ReturnType<typeof useSortable>["attributes"];
type DragListeners = ReturnType<typeof useSortable>["listeners"];

interface DragHandleValue {
  attributes: DragAttributes;
  listeners: DragListeners;
  onDelete?: () => void;
}

const DragHandleContext = createContext<DragHandleValue | null>(null);

export function useDragHandle() {
  return useContext(DragHandleContext);
}

interface SortableSectionProps {
  id: string;
  children: ReactNode;
  onDelete?: () => void;
}

export function SortableSection({ id, children, onDelete }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <DragHandleContext.Provider value={{ attributes, listeners, onDelete }}>
        {children}
      </DragHandleContext.Provider>
    </div>
  );
}
