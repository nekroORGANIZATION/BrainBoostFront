'use client';
import React from 'react';

export function FixedImg({
  src,
  alt,
  style,
  className,
}: {
  src?: string;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [err, setErr] = React.useState(false);
  const s = src && !err ? src : '/images/placeholder.png';
  return (
    <img
      src={s}
      alt={alt || ''}
      style={style}
      className={className}
      onError={() => setErr(true)}
    />
  );
}
