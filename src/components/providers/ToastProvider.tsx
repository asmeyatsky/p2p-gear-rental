'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      closeButton
      richColors
      expand
      visibleToasts={4}
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          color: '#374151',
        },
        className: 'toaster group toast',
        descriptionClassName: 'group-[.toast]:text-muted-foreground',
      }}
    />
  );
}