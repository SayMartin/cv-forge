import type { ReactNode } from "react";

// One atomic, unsplittable unit of CV content (a single entry, or a whole
// section when its entries don't need independent pagination).
export type PageBlock = {
  id: string;
  node: ReactNode;
};
