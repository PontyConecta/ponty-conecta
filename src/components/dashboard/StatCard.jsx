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
      <Card className="h-[120px] border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 lg:p-5 h-full flex flex-col items-center justify-center text-center gap-2">
          <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight tabular-nums leading-none">{value}</div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight mt-0.5">{label}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}