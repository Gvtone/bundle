import { Outlet } from "react-router";
import MainHeader from "./MainHeader";

function DocumentLayout() {
  return (
    <main className="flex w-full h-full">
      <div className="flex flex-col w-full h-full">
        <MainHeader />
        <Outlet />
      </div>
    </main>
  );
}

export default DocumentLayout;
