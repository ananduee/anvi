import { useRecoilValue } from "recoil";
import AddIcon from "../icons/AddIcon";
import { atomProjects } from "../../state/project";

export default function LeftMenu() {
  let projects = useRecoilValue(atomProjects);
  return (
    <div className="w-56 px-4 py-4 bg-gray-100 border-r overflow-auto">
      <nav className="mt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-600">Projects</h3>
          <span className="text-gray-700 cursor-pointer">
            <AddIcon iconClass="w-5 h-5" />
          </span>
        </div>
      </nav>
    </div>
  );
}
