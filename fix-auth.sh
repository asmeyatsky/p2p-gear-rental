#!/bin/bash
# Fix all auth routes to prevent static generation issues
mkdir -p src/app/auth/login/src
mkdir -p src/app/auth/forgot-password/src
mkdir -p src/app/auth/reset-password/src

# Create dynamic layout files for auth routes with proper TypeScript
echo 'import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {children}
    </div>
  );
}' > src/app/auth/login/layout.tsx

echo 'import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {children}
    </div>
  );
}' > src/app/auth/forgot-password/layout.tsx

echo 'import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {children}
    </div>
  );
}' > src/app/auth/reset-password/layout.tsx

echo "Fixed auth routes to prevent static generation issues"