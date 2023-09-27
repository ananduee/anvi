import { useRecoilValue } from "recoil";
import { atomActiveProject } from "../../state/project";

export default function ProjectView() {
  let activeProject = useRecoilValue(atomActiveProject);

  return (
    <div className="flex-1 min-w-0 bg-white flex flex-col">
      <p>Selected project {activeProject}</p>
    </div>
  )
}
