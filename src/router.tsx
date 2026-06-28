import { createBrowserRouter } from "react-router";
import RootLayout from "./renderer/components/layout/RootLayout";
import AppLayout from "./renderer/components/layout/AppLayout";
import EditTemplatePage from "./renderer/pages/EditTemplatePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        element: (
          <AppLayout>
            <EditTemplatePage />
          </AppLayout>
        )
      }
    ]
  }
]);
