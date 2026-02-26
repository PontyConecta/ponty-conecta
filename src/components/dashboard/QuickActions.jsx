import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { brandActions, creatorActions } from './quickActionConfig';

export default function QuickActions({ profileType, isSubscribed }) {
  const actions = profileType === 'brand' ? brandActions : creatorActions;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4" style={{ minHeight: 140 }}>
      {actions.map((action, index) => {
        const needsSub = action.requiresSub && !isSubscribed;
        const targetPage = needsSub ? 'Subscription' : action.page;

        return (
          <Link key={action.label} to={createPageUrl(targetPage)} className="block h-[140px]">
            <DashboardCard index={index}>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center relative shrink-0"
                style={{ backgroundColor: action.bg }}
              >
                <action.icon className="w-5 h-5 text-white" />
                {needsSub && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#9038fa] rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs sm:text-sm font-medium leading-tight text-foreground mt-2.5">
                {action.label}
              </span>
            </DashboardCard>
          </Link>
        );
      })}
    </div>
  );
}