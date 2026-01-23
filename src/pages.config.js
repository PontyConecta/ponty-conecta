import Home from './pages/Home';
import SelectProfile from './pages/SelectProfile';
import OnboardingBrand from './pages/OnboardingBrand';
import OnboardingCreator from './pages/OnboardingCreator';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "SelectProfile": SelectProfile,
    "OnboardingBrand": OnboardingBrand,
    "OnboardingCreator": OnboardingCreator,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};