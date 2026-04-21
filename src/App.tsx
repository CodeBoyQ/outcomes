import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { TopBar } from './components/TopBar';
import { GraphCanvas } from './components/GraphCanvas';
import { SidePanel } from './components/SidePanel';
import { Toast } from './components/Toast';
import { useStore } from './store/useStore';

function App() {
  const loadAll = useStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />
      <div className="flex-1 flex relative overflow-hidden">
        <ReactFlowProvider>
          <GraphCanvas />
          <SidePanel />
        </ReactFlowProvider>
      </div>
      <Toast />
    </div>
  );
}

export default App;
