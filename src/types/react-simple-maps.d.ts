declare module 'react-simple-maps' {
  import type { ComponentType, ReactNode, CSSProperties } from 'react';
  type AnyProps = { children?: ReactNode; style?: CSSProperties | Record<string, CSSProperties>; [k: string]: unknown };
  export const ComposableMap: ComponentType<AnyProps>;
  export const Geographies: ComponentType<{
    geography: string | object;
    children: (args: { geographies: Array<{ rsmKey: string; [k: string]: unknown }> }) => ReactNode;
  }>;
  export const Geography: ComponentType<AnyProps>;
  export const Marker: ComponentType<AnyProps & { coordinates: [number, number] }>;
}
