import TitleBar from "./TitleBar";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

export default AppLayout;
