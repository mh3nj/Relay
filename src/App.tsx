import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";

const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const LearnPage = lazy(() =>
  import("@/features/learn/pages/LearnPage").then((m) => ({ default: m.LearnPage }))
);
const PracticePage = lazy(() =>
  import("@/features/practice/pages/PracticePage").then((m) => ({ default: m.PracticePage }))
);
const TranslatorPage = lazy(() =>
  import("@/features/translator/pages/TranslatorPage").then((m) => ({ default: m.TranslatorPage }))
);
const GamesPage = lazy(() =>
  import("@/features/games/pages/GamesPage").then((m) => ({ default: m.GamesPage }))
);
const ProgressPage = lazy(() =>
  import("@/features/progress/pages/ProgressPage").then((m) => ({ default: m.ProgressPage }))
);
const EncyclopediaPage = lazy(() =>
  import("@/features/encyclopedia/pages/EncyclopediaPage").then((m) => ({
    default: m.EncyclopediaPage,
  }))
);
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);

function RouteFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh] text-on-surface-variant">
      {t("common.loading")}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/translator" element={<TranslatorPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/encyclopedia" element={<EncyclopediaPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
