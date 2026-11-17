import { HashRouter, Routes, Route } from "react-router-dom";
import { AppStoreProvider } from "@/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Overview } from "@/pages/Overview";
import { Models } from "@/pages/Models";
import { Proxy } from "@/pages/Proxy";
import { CliSync } from "@/pages/CliSync";
import { Servers } from "@/pages/Servers";
import { ManagerMcp } from "@/pages/ManagerMcp";
import { Catalog } from "@/pages/Catalog";
import { Builder } from "@/pages/Builder";
import { Settings } from "@/pages/Settings";

const App = () => (
  <AppStoreProvider>
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Overview />} />
          <Route path="models" element={<Models />} />
          <Route path="proxy" element={<Proxy />} />
          <Route path="sync" element={<CliSync />} />
          <Route path="servers" element={<Servers />} />
          <Route path="manager-mcp" element={<ManagerMcp />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="builder" element={<Builder />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  </AppStoreProvider>
);

export default App;
