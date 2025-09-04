'use client';

import {SSRProvider} from 'react-aria';
import {Provider as RACProvider} from 'react-aria-components';
import {NextUIProvider} from '@nextui-org/react';

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <SSRProvider>
      <RACProvider>
        <NextUIProvider>
          {children}
        </NextUIProvider>
      </RACProvider>
    </SSRProvider>
  );
}
