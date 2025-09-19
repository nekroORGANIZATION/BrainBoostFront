'use client';
import React from 'react';

export function Text({
  text,
  fz,
  lh,
  fw,
  color = '#000',
  width,
  height,
  align = 'left',
  family = 'Mulish, system-ui, sans-serif',
  shadow,
}: {
  text: string;
  fz: number;
  lh: number | string;
  fw: number;
  color?: string;
  width?: number | string;
  height?: number | string;
  align?: 'left' | 'center' | 'right';
  family?: string;
  shadow?: string;
}) {
  return (
    <div
      style={{
        fontFamily: family,
        fontWeight: fw,
        fontSize: fz,
        lineHeight: typeof lh === 'number' ? `${lh}px` : lh,
        color,
        width,
        height,
        textAlign: align,
        textShadow: shadow,
      }}
    >
      {text}
    </div>
  );
}
