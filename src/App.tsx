import { useRecoilValue } from "recoil";
import "./App.css";
import LeftMenu from "./components/ui/LeftMenu";
import WorkspaceFolderPicker from "./components/ui/WorkspaceFolderPicker";
import { workspaceSelector } from "./state/config";

function App() {
  let workspace = useRecoilValue(workspaceSelector);

  return (
    <div className="h-screen flex">
      {workspace == null ? <WorkspaceFolderPicker /> : <LeftMenu />}
    </div>
  );
}

export default App;
