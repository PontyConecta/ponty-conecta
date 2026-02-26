import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

/**
 * Base card used by both QuickActions and StatCards.
 * Ensures identical height, padding, border, radius, shadow.
 */
export default function DashboardCard({ children, index = 0, onClick, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="h-full"
    >
      <Card
        className={`h-full border bg-card shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
        onClick={onClick}
      >
        <CardContent className="p-4 lg:p-5 h-full flex flex-col items-center justify-center text-center">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}