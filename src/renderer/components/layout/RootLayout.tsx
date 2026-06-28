import { ThemeProvider } from "@/renderer/context/theme/ThemeProvider";
import { Suspense } from "react";
import { Outlet } from "react-router";

function RootLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">
          <Suspense>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default RootLayout;
