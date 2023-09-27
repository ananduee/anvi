import { useRecoilValue } from "recoil";
import "./App.css";
import LeftMenu from "./components/ui/LeftMenu";
import WorkspaceFolderPicker from "./components/ui/WorkspaceFolderPicker";
import { workspaceSelector } from "./state/config";
import ProjectView from "./components/ui/ProjectView";
import React from "react";

function SelectedWorkspaceView() {
  return (
    <>
      <LeftMenu />
      <React.Suspense fallback={<p className="ml-2">Select a project</p>}>
        <ProjectView />
      </React.Suspense>
    </>
  );
}

function App() {
  let workspace = useRecoilValue(workspaceSelector);

  return (
    <div className="h-screen flex">
      {workspace == null ? (
        <WorkspaceFolderPicker />
      ) : (
        <SelectedWorkspaceView />
      )}
    </div>
  );
}

export default App;
