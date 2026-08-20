import { Outlet } from "react-router";
import MainHeader from "./MainHeader";
import { TemplateProvider } from "@/renderer/context/TemplateContext";

function DocumentLayout() {
  return (
    <TemplateProvider>
      <div className="flex flex-col w-full h-full overflow-hidden">
        <MainHeader />
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>
    </TemplateProvider>
  );
}

export default DocumentLayout;
