import { Outlet } from "react-router";
import MainHeader from "./MainHeader";
import { TemplateProvider } from "@/renderer/context/TemplateContext";

function DocumentLayout() {
  return (
    <TemplateProvider>
      <div className="flex flex-col w-full h-full">
        <MainHeader />
        <Outlet />
      </div>
    </TemplateProvider>
  );
}

export default DocumentLayout;
