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
      <Card className="h-full transition-shadow duration-200 hover:shadow-md">
        <CardContent className="p-4 lg:p-6 h-full flex flex-col">
          <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl ${color} flex items-center justify-center mb-3 shadow-sm`}>
            <Icon className="w-5 h-5 lg:w-5 lg:h-5 text-white" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold mb-0.5">{value}</div>
          <div className="text-xs lg:text-sm font-medium text-muted-foreground">{label}</div>
          <div className="text-[10px] lg:text-xs mt-auto pt-2 font-medium text-primary" style={{ opacity: total > 0 ? 1 : 0 }}>
            {total > 0 ? `de ${total} no total` : '\u00A0'}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}