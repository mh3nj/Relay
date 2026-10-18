import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTopBar, MobileBottomNav } from "@/components/layout/MobileNav";
import { AiChatWidget } from "@/components/ai/AiChatWidget";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { useAccessibilitySettings } from "@/hooks/useAccessibilitySettings";

export function AppShell() {
  // Applying these here (rather than only inside Settings) means the
  // chosen theme and accessibility overrides take effect immediately on
  // every route, not just after visiting Settings once.
  useThemeSettings();
  useAccessibilitySettings();

  return (
    <div className="flex h-screen bg-background text-on-background font-sans text-body-md antialiased overflow-hidden">
      <Sidebar />
      <main className="flex-1 md:ml-[280px] h-screen overflow-y-auto bg-background relative flex flex-col">
        <MobileTopBar />
        <div className="flex-1 p-md md:p-2xl max-w-container-max mx-auto w-full flex flex-col gap-xl pb-24 md:pb-xl">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
      <AiChatWidget />
    </div>
  );
}
