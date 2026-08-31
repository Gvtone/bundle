import { ThemeProvider } from "@/renderer/context/theme/ThemeProvider";
import { useTheme } from "@/renderer/context/theme/useTheme";
import { Suspense } from "react";
import { Outlet } from "react-router";
import { Toaster } from "sonner";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";
import { TemplatesProvider } from "@/renderer/context/TemplatesContext";

function RootLayoutContent() {
  const { isDark } = useTheme();

  return (
    <TemplatesProvider>
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
