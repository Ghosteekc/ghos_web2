import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 lg:ml-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}