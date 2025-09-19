'use client';
import React from 'react';

export function Abs({
  x,
  y,
  children,
}: {
  x: number | string;
  y: number | string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x as any,
        top: y as any,
      }}
    >
      {children}
    </div>
  );
}
