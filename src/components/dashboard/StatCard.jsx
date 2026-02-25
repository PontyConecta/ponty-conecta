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
      <Card className="h-full transition-all duration-200 hover:-translate-y-0.5" style={{ boxShadow: 'var(--shadow-sm)' }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
      >
        <CardContent className="p-4 lg:p-6 h-full flex flex-col">
          <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl ${color} flex items-center justify-center mb-3 shadow-sm`}>
            <Icon className="w-5 h-5 lg:w-5 lg:h-5 text-white" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{value}</div>
          <div className="text-xs lg:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</div>
          <div className="text-[10px] lg:text-xs mt-auto pt-2 font-medium" style={{ color: 'var(--accent-primary)', opacity: total > 0 ? 1 : 0 }}>
            {total > 0 ? `de ${total} no total` : '\u00A0'}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}