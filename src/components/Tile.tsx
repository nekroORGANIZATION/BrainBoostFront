'use client';
import React from 'react';
import { FixedImg } from './FixedImg';

export function Tile({ src }: { src: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: '1.4px solid #1345DE',
        borderRadius: 20,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <FixedImg
        src={src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}
