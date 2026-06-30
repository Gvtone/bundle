import { Outlet } from "react-router";
import MainHeader from "./MainHeader";

function DocumentLayout() {
  return (
    <main className="flex flex-col w-full h-full">
      <MainHeader />
      <Outlet />
    </main>
  );
}

export default DocumentLayout;
