import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/contexts/AuthContext';

const BACK_MAP = {
  InboxThread:          { page: 'Inbox',            label: 'Mensagens'     },
  ApplicationsManager:  { page: 'CampaignManager',  label: 'Campanhas'     },
  DeliveriesManager:    { page: 'CampaignManager',  label: 'Campanhas'     },
  MyApplications:       { page: 'OpportunityFeed',  label: 'Oportunidades' },
  MyDeliveries:         { page: 'OpportunityFeed',  label: 'Entregas'      },
  MissionsAchievements: { page: 'CreatorDashboard', label: 'Início'        },
  AdminUsers:           { page: 'AdminDashboard',   label: 'Admin'         },
  AdminCampaigns:       { page: 'AdminDashboard',   label: 'Admin'         },
  AdminDisputes:        { page: 'AdminDashboard',   label: 'Admin'         },
  AdminAuditLogs:       { page: 'AdminDashboard',   label: 'Admin'         },
  AdminTransactions:    { page: 'AdminDashboard',   label: 'Admin'         },
};

export const LEAF_PAGES = new Set([
  'InboxThread', 'ApplicationsManager', 'DeliveriesManager',
  'MyApplications', 'MyDeliveries', 'Settings', 'Profile',
  'Subscription', 'Feedback', 'MissionsAchievements',
  'AdminUsers', 'AdminCampaigns', 'AdminDisputes', 'AdminAuditLogs', 'AdminTransactions',
]);

export default function useSmartBack(currentPage) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { profileType } = useAuth();

  const dashboardPage = profileType === 'brand' ? 'BrandDashboard' : 'CreatorDashboard';
  const staticDest    = BACK_MAP[currentPage] || { page: dashboardPage, label: 'Início' };

  const goBack = () => {
    if (location.state?.from) {
      navigate(createPageUrl(location.state.from));
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(createPageUrl(staticDest.page));
    }
  };

  const backLabel = location.state?.fromLabel || staticDest.label;
  return { goBack, backLabel };
}