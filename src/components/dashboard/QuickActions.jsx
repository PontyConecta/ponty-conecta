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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
              <Card className="h-[108px] sm:h-[116px] border bg-card shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="p-4 lg:p-5 h-full flex flex-col justify-center items-start gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                    style={{ backgroundColor: action.bg }}
                  >
                    <action.icon className="w-5 h-5 text-white" />
                    {needsSub && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#9038fa] rounded-full flex items-center justify-center">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium leading-tight text-foreground text-left">
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