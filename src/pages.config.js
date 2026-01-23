import Home from './pages/Home';
import SelectProfile from './pages/SelectProfile';
import OnboardingBrand from './pages/OnboardingBrand';
import OnboardingCreator from './pages/OnboardingCreator';
import Subscription from './pages/Subscription';
import BrandDashboard from './pages/BrandDashboard';
import CreatorDashboard from './pages/CreatorDashboard';
import CampaignManager from './pages/CampaignManager';
import OpportunityFeed from './pages/OpportunityFeed';
import ApplicationsManager from './pages/ApplicationsManager';
import DeliveriesManager from './pages/DeliveriesManager';
import MyApplications from './pages/MyApplications';
import MyDeliveries from './pages/MyDeliveries';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "SelectProfile": SelectProfile,
    "OnboardingBrand": OnboardingBrand,
    "OnboardingCreator": OnboardingCreator,
    "Subscription": Subscription,
    "BrandDashboard": BrandDashboard,
    "CreatorDashboard": CreatorDashboard,
    "CampaignManager": CampaignManager,
    "OpportunityFeed": OpportunityFeed,
    "ApplicationsManager": ApplicationsManager,
    "DeliveriesManager": DeliveriesManager,
    "MyApplications": MyApplications,
    "MyDeliveries": MyDeliveries,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};