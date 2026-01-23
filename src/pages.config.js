import ApplicationsManager from './pages/ApplicationsManager';
import BrandDashboard from './pages/BrandDashboard';
import CampaignManager from './pages/CampaignManager';
import CreatorDashboard from './pages/CreatorDashboard';
import DeliveriesManager from './pages/DeliveriesManager';
import Home from './pages/Home';
import MyApplications from './pages/MyApplications';
import MyDeliveries from './pages/MyDeliveries';
import OnboardingBrand from './pages/OnboardingBrand';
import OnboardingCreator from './pages/OnboardingCreator';
import OpportunityFeed from './pages/OpportunityFeed';
import Profile from './pages/Profile';
import SelectProfile from './pages/SelectProfile';
import Subscription from './pages/Subscription';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ApplicationsManager": ApplicationsManager,
    "BrandDashboard": BrandDashboard,
    "CampaignManager": CampaignManager,
    "CreatorDashboard": CreatorDashboard,
    "DeliveriesManager": DeliveriesManager,
    "Home": Home,
    "MyApplications": MyApplications,
    "MyDeliveries": MyDeliveries,
    "OnboardingBrand": OnboardingBrand,
    "OnboardingCreator": OnboardingCreator,
    "OpportunityFeed": OpportunityFeed,
    "Profile": Profile,
    "SelectProfile": SelectProfile,
    "Subscription": Subscription,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};