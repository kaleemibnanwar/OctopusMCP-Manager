import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TitleBar } from "./TitleBar";
import { Toaster } from "@/components/ui/bits";

export function AppShell() {
  return (
    <div className="flex h-full flex-col bg-km-bg">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="km-scroll flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
