"use client";
import * as React from "react";
// NextUI global provider
import { NextUIProvider } from "@nextui-org/react";
// React Aria SSR provider to avoid hydration/SSR warnings and enable accessibility
import { SSRProvider } from "react-aria";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SSRProvider>
      <NextUIProvider>
        {children}
      </NextUIProvider>
    </SSRProvider>
  );
}
