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
      <Card className="h-full border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 lg:p-5 h-full flex flex-col">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-2.5`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight tabular-nums mb-0.5">{value}</div>
          <div className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{label}</div>
          {total > 0 && (
            <div className="text-[10px] lg:text-xs mt-auto pt-2 font-medium text-primary">
              de {total} no total
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}