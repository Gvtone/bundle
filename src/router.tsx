import { createMemoryRouter } from "react-router";
import RootLayout from "./renderer/components/layout/RootLayout";
import EditTemplatePage from "./renderer/pages/EditTemplatePage";
import DocumentLayout from "./renderer/components/layout/DocumentLayout";
import FillAndPreviewPage from "./renderer/pages/FillAndPreviewPage";
import EmptyStatePage from "./renderer/pages/EmptyStatePage";

export const router = createMemoryRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, element: <EmptyStatePage /> },
      {
        path: "templates/:templateId",
        Component: DocumentLayout,
        children: [
          { path: "edit", element: <EditTemplatePage /> },
          { path: "fill", element: <FillAndPreviewPage /> }
        ]
      }
    ]
  }
]);
