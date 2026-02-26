import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, total, icon: Icon, color, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="h-full min-h-[120px] border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 lg:p-5 h-full flex flex-col justify-between">
          <div>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${color} flex items-center justify-center mb-2.5`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-0.5 tabular-nums">{value}</div>
            <div className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground leading-tight">{label}</div>
          </div>
          {total > 0 && (
            <div className="text-[10px] lg:text-xs mt-2 pt-1.5 font-medium text-primary border-t border-border/50">
              de {total} no total
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}