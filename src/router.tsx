import { createMemoryRouter } from "react-router";
import RootLayout from "./renderer/components/layout/RootLayout";
import EditTemplatePage from "./renderer/pages/EditTemplatePage";
import DocumentLayout from "./renderer/components/layout/DocumentLayout";

export const router = createMemoryRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        path: "templates/:templateId",
        Component: DocumentLayout,
        children: [
          { path: "edit", element: <EditTemplatePage /> }
          // { path: "fill", element: <FillAndPreviewPage /> }
        ]
      }
    ]
  }
]);
