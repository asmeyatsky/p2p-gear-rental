'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  delay?: number;
  whileHover?: boolean;
  whileTap?: boolean;
}

const AnimatedCard = ({ 
  children, 
  className, 
  index = 0, 
  delay = 0, 
  whileHover = true,
  whileTap = true
}: AnimatedCardProps) => {
  const hoverAnimation = whileHover ? { 
    y: -8,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
  } : {};

  const tapAnimation = whileTap ? { scale: 0.98 } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.4, 
          delay: delay + (index * 0.05) 
        } 
      }}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      className={cn(
        'bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

AnimatedCard.Header = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('p-4 border-b border-gray-100', className)}>
    {children}
  </div>
);

AnimatedCard.Body = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('p-4', className)}>
    {children}
  </div>
);

AnimatedCard.Footer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('p-4 border-t border-gray-100 flex justify-end space-x-3', className)}>
    {children}
  </div>
);

export { AnimatedCard };