import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { brandActions, creatorActions } from './quickActionConfig';

export default function QuickActions({ profileType, isSubscribed }) {
  const actions = profileType === 'brand' ? brandActions : creatorActions;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action, index) => {
        const needsSub = action.requiresSub && !isSubscribed;
        const targetPage = needsSub ? 'Subscription' : action.page;

        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link to={createPageUrl(targetPage)}>
              <Card className="transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center relative shadow-sm"
                    style={{ backgroundColor: action.bg }}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                    {needsSub && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#9038fa] rounded-full flex items-center justify-center shadow">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {action.label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}