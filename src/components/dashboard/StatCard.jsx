import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, total, icon: Icon, color, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card className="h-[120px] border bg-card shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-4 lg:p-5 h-full flex flex-col justify-between">
          <div
            className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight tabular-nums leading-none">
              {value}
            </div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight mt-0.5">
              {label}
            </div>
            {total !== undefined && (
              <div className="text-[11px] text-muted-foreground/70 leading-tight mt-0.5">
                de {total} no total
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}