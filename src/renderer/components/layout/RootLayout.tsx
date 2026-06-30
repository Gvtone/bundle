import { ThemeProvider } from "@/renderer/context/theme/ThemeProvider";
import { Suspense } from "react";
import { Outlet } from "react-router";
import TitleBar from "./TitleBar";
import Sidebar from "./Sidebar";

function RootLayout() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default RootLayout;
