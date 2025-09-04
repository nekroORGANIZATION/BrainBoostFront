'use client';

import * as React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = '', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`px-4 py-2 bg-blue-500 text-white rounded ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
