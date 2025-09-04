"use client";

import * as React from "react";
import { SSRProvider } from "react-aria";
import { Provider as RACProvider } from "react-aria-components";
import { NextUIProvider } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <SSRProvider>
      <RACProvider>
        <NextUIProvider navigate={router.push}>
          {children}
        </NextUIProvider>
      </RACProvider>
    </SSRProvider>
  );
}
