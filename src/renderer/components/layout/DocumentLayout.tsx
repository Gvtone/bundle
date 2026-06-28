import Sidebar from "./Sidebar";

function DocumentLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex w-full h-full">
      <Sidebar />
      {children}
    </div>
  );
}

export default DocumentLayout;
