/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminCampaigns from './pages/AdminCampaigns';
import AdminDashboard from './pages/AdminDashboard';
import AdminDisputes from './pages/AdminDisputes';
import AdminUsers from './pages/AdminUsers';
import Applications from './pages/Applications';
import ApplicationsManager from './pages/ApplicationsManager';
import BrandDashboard from './pages/BrandDashboard';
import CampaignManager from './pages/CampaignManager';
import CreatorDashboard from './pages/CreatorDashboard';
import Deliveries from './pages/Deliveries';
import DeliveriesManager from './pages/DeliveriesManager';
import DiscoverBrands from './pages/DiscoverBrands';
import DiscoverCreators from './pages/DiscoverCreators';
import Home from './pages/Home';
import MyApplications from './pages/MyApplications';
import MyDeliveries from './pages/MyDeliveries';
import OnboardingBrand from './pages/OnboardingBrand';
import OnboardingCreator from './pages/OnboardingCreator';
import OpportunityFeed from './pages/OpportunityFeed';
import Profile from './pages/Profile';
import SelectProfile from './pages/SelectProfile';
import Subscription from './pages/Subscription';
import SubscriptionPage from './pages/SubscriptionPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAuditLogs": AdminAuditLogs,
    "AdminCampaigns": AdminCampaigns,
    "AdminDashboard": AdminDashboard,
    "AdminDisputes": AdminDisputes,
    "AdminUsers": AdminUsers,
    "Applications": Applications,
    "ApplicationsManager": ApplicationsManager,
    "BrandDashboard": BrandDashboard,
    "CampaignManager": CampaignManager,
    "CreatorDashboard": CreatorDashboard,
    "Deliveries": Deliveries,
    "DeliveriesManager": DeliveriesManager,
    "DiscoverBrands": DiscoverBrands,
    "DiscoverCreators": DiscoverCreators,
    "Home": Home,
    "MyApplications": MyApplications,
    "MyDeliveries": MyDeliveries,
    "OnboardingBrand": OnboardingBrand,
    "OnboardingCreator": OnboardingCreator,
    "OpportunityFeed": OpportunityFeed,
    "Profile": Profile,
    "SelectProfile": SelectProfile,
    "Subscription": Subscription,
    "SubscriptionPage": SubscriptionPage,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};