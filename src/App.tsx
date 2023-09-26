import "./App.css";
import LeftMenu from "./components/ui/LeftMenu";
import WorkspaceFolderPicker from "./components/ui/WorkspaceFolderPicker";

function App() {

  return (
    <div className="h-screen flex">
      <WorkspaceFolderPicker />
    </div>
  );
}

export default App;
