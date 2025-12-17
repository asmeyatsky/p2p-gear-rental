import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export default function Layout({
  children,
  showHeader = true,
  showFooter = true,
  className = '',
  maxWidth = 'xl',
}: LayoutProps) {
  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden text-sm">
      {showHeader && <Header />}
      <main className={`flex-1 overflow-auto ${className}`}>
        <div className={`mx-auto px-3 sm:px-4 lg:px-6 py-3 ${maxWidthStyles[maxWidth]}`}>
          {children}
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

interface PageLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageLayout({
  title,
  subtitle,
  children,
  actions,
  breadcrumbs,
}: PageLayoutProps) {
  return (
    <Layout>
      {(title || subtitle || actions || breadcrumbs) && (
        <div className="mb-8">
          {breadcrumbs && (
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex">
                    {index > 0 && (
                      <svg className="flex-shrink-0 h-4 w-4 text-gray-400 mx-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {crumb.href ? (
                      <a href={crumb.href} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              {title && <h1 className="text-3xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
            </div>
            {actions && <div>{actions}</div>}
          </div>
        </div>
      )}
      {children}
    </Layout>
  );
}

// Container component - simple wrapper for content sections (does NOT include Header/Footer)
export function Container({
  children,
  size = 'xl',
  className = ''
}: {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}) {
  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthStyles[size]} ${className}`}>
      {children}
    </div>
  );
}

// Grid component for layout
export function Grid({ 
  children, 
  cols = 1,
  gap = 6,
  className = '' 
}: { 
  children: React.ReactNode; 
  cols?: number;
  gap?: number;
  className?: string;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };

  return (
    <div className={`grid ${gridCols[cols as keyof typeof gridCols] || 'grid-cols-1'} gap-${gap} ${className}`}>
      {children}
    </div>
  );
}

