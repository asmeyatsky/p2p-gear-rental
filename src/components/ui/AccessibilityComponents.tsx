import { ReactNode } from 'react';

interface AccessibilityProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  role?: string;
  tabIndex?: number;
}

export function AccessibleButton({ 
  children, 
  className = '', 
  ...accessibilityProps 
}: AccessibilityProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        px-4 py-2
        font-medium
        rounded-lg
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${className}
      `.trim()}
      {...accessibilityProps}
      aria-label={accessibilityProps['aria-label'] || undefined}
      aria-describedby={accessibilityProps['aria-describedby']}
      aria-expanded={accessibilityProps['aria-expanded']}
      role={accessibilityProps.role}
      tabIndex={accessibilityProps.tabIndex || 0}
    >
      {children}
    </button>
  );
}

interface FocusableElementProps {
  children: ReactNode;
  className?: string;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  trapFocus?: boolean;
}

export function FocusTrap({ children, className = '', trapFocus = false, onKeyDown }: FocusableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trapFocus || !elementRef.current) return;

    const element = elementRef.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const firstElement = focusableElements[0] as HTMLElement;
        firstElement?.focus();
        onKeyDown?.(event);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        const focusableArray = Array.from(focusableElements) as HTMLElement[];
        const currentIndex = focusableArray.indexOf(document.activeElement as HTMLElement);
        
        if (event.shiftKey) {
          // Focus previous element
          const prevIndex = currentIndex <= 0 ? focusableArray.length - 1 : currentIndex - 1;
          const prevElement = focusableArray[prevIndex];
          prevElement?.focus();
        } else {
          // Focus next element
          const nextIndex = currentIndex === focusableArray.length - 1 ? 0 : currentIndex + 1;
          const nextElement = focusableArray[nextIndex];
          nextElement?.focus();
        }
        
        onKeyDown?.(event);
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapFocus, onKeyDown]);

  return (
    <div 
      ref={elementRef}
      className={className}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

// Skip to main content link for keyboard navigation
export function SkipLink({ children, targetId = 'main-content' }: { children: ReactNode; targetId: string }) {
  return (
    <a 
      href={`#${targetId}`}
      className="sr-only focus:absolute left-0 top-0 -top-10 z-50 p-4 bg-blue-600 text-white rounded-lg"
      onFocus={() => {
        document.getElementById(targetId)?.focus();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          document.getElementById(targetId)?.focus();
        }
      }}
    >
      {children}
    </a>
  );
}

// Announcer for screen readers
export function LiveRegion({ children, polite = false }: { children: ReactNode; polite?: boolean }) {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 3000);
  };

  return (
    <>
      <div className="sr-only" aria-live={polite ? 'polite' : 'assertive'} aria-atomic="true">
        {announcement}
      </div>
      <div>
        {children}
      </div>
    </>
  );
}