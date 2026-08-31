import { ThemeProvider } from "@/renderer/context/theme/ThemeProvider";
import { useTheme } from "@/renderer/context/theme/useTheme";
import { Suspense, useEffect } from "react";
import { Outlet } from "react-router";
import { Toaster } from "sonner";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";
import { TemplatesProvider, useTemplates } from "@/renderer/context/TemplatesContext";

// Signals the main process to swap the splash screen for the real window —
// fired once the initial template list has actually loaded, not just on
// first paint, so the splash covers the real loading time (see main.ts).
function NotifyAppReady() {
  const { loading } = useTemplates();

  useEffect(() => {
    if (loading) return;
    // loading flipping false only means the data is ready, not that the
    // browser has actually painted the resulting DOM update yet — wait two
    // animation frames (same waitForPaint pattern FillAndPreviewPage.tsx
    // uses before capturing a print snapshot) so the signal reflects a real
    // paint, not just a state change main.ts can't see.
    let canceled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!canceled) window.bundle.notifyReady();
      });
    });
    return () => {
      canceled = true;
    };
  }, [loading]);

  return null;
}

function RootLayoutContent() {
  const { isDark } = useTheme();

  return (
    <TemplatesProvider>
      <NotifyAppReady />
      <div className="min-h-screen flex flex-col bg-background print:bg-white">
        <div className="flex-1">
          <Suspense>
            <div className="flex flex-col h-screen print:h-auto">
              <TitleBar />
              <div className="flex flex-1 overflow-hidden print:flex-none print:h-auto print:overflow-visible">
                <Sidebar />
                <Outlet />
              </div>
            </div>
          </Suspense>
        </div>
      </div>
      <Toaster
        position="bottom-right"
        theme={isDark ? "dark" : "light"}
        className="print:hidden"
      />
    </TemplatesProvider>
  );
}

function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

export default RootLayout;
