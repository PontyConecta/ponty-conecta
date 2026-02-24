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
      <Card className="hover:shadow-md transition-shadow h-full" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <CardContent className="p-4 lg:p-6 h-full flex flex-col">
          <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
            <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
          <div className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</div>
          <div className="text-[10px] lg:text-xs mt-auto pt-1" style={{ color: 'var(--text-secondary)' }}>
            {total > 0 ? `de ${total} no total` : '\u00A0'}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}