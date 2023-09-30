import "./App.css";
import LeftMenu from "./components/ui/LeftMenu";
import WorkspaceFolderPicker from "./components/ui/WorkspaceFolderPicker";
import ProjectView from "./components/ui/ProjectView";
import { useAtomValue } from "jotai";
import { workspaceAtom } from "./state/config";

function SelectedWorkspaceView(props: { workspace: string }) {
  return (
    <>
      <LeftMenu workspace={props.workspace} />
      <ProjectView workspace={props.workspace} />
    </>
  );
}

function App() {
  let workspace = useAtomValue(workspaceAtom);

  return (
    <div className="h-screen flex">
      {workspace == null ? (
        <WorkspaceFolderPicker />
      ) : (
        <SelectedWorkspaceView workspace={workspace} />
      )}
    </div>
  );
}

export default App;
