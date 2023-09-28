import { useRecoilValue } from "recoil";
import { atomActiveProject } from "../../state/project";

export default function ProjectView() {
  let activeProject = useRecoilValue(atomActiveProject);

  return (
    <div className="flex-1 bg-white flex flex-col">
      <header className="shrink-0 border-b-2 border-gray-200 px-6">
        <h2 className="text-lg font-semibold">{activeProject}</h2>
      </header>
      
    </div>
  )
}
