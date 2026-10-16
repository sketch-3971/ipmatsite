import { Sidebar } from "./components/layout/Sidebar.jsx";
import { Header } from "./components/layout/Header.jsx";
import { LoadingOverlay, Toast } from "./components/ui/Feedback.jsx";
import { useApp } from "./store/AppStore.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Mocks from "./views/Mocks.jsx";
import TopicTests from "./views/TopicTests.jsx";
import PYPs from "./views/PYPs.jsx";
import Videos from "./views/Videos.jsx";
import Analytics from "./views/Analytics.jsx";
import Pricing from "./views/Pricing.jsx";
import AIPractice from "./practice/AIPractice.jsx";

const VIEWS = { dashboard: Dashboard, mocks: Mocks, topics: TopicTests, ai: AIPractice, pyps: PYPs, videos: Videos, analytics: Analytics, pricing: Pricing };

export default function App() {
  const { view } = useApp();
  const View = VIEWS[view] || Dashboard;
  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main" className="flex-1 overflow-y-auto">
          <div key={view} className="mx-auto w-full max-w-6xl animate-fade px-4 py-6 sm:px-8 sm:py-8">
            <View />
          </div>
        </main>
      </div>
      <LoadingOverlay />
      <Toast />
    </div>
  );
}
