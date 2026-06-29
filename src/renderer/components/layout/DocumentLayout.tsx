import MainHeader from "./MainHeader";
import Sidebar from "./Sidebar";

function DocumentLayout({ children }: { children?: React.ReactNode }) {
  return (
    <main className="flex w-full h-full">
      <Sidebar />
      <div className="flex flex-col w-full h-full">
        <MainHeader />
        {children}
      </div>
    </main>
  );
}

export default DocumentLayout;
