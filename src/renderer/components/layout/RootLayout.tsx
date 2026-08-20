import { ThemeProvider } from "@/renderer/context/theme/ThemeProvider";
import { Suspense } from "react";
import { Outlet } from "react-router";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";
import { TemplatesProvider } from "@/renderer/context/TemplatesContext";

function RootLayout() {
  return (
    <ThemeProvider>
      <TemplatesProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <div className="flex-1">
            <Suspense>
              <div className="flex flex-col h-screen">
                <TitleBar />
                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />
                  <Outlet />
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      </TemplatesProvider>
    </ThemeProvider>
  );
}

export default RootLayout;
