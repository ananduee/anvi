import { useRecoilRefresher_UNSTABLE, useRecoilValue, useResetRecoilState } from "recoil";
import { atomActiveProject, selectorProjects } from "../../state/project";
import DownArrowIcon from "../icons/DownArrowIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback } from "react";
import { tauriClient } from "../../state/client";

function ProjectControls(props: { name: string; workspace: string }) {
  const resetActiveProject = useResetRecoilState(atomActiveProject);
  const refetchWorkspaceProjects = useRecoilRefresher_UNSTABLE(selectorProjects);
  const onDelete = useCallback(async () => {
    try {
      await tauriClient.deleteProject(props.workspace, props.name);
      resetActiveProject();
      refetchWorkspaceProjects();
    } catch (e) {
      console.error("Error while deleting project", e);
    }
    
  }, [resetActiveProject, refetchWorkspaceProjects]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <DownArrowIcon iconClass="w-6 h-6 pt-1 cursor-pointer " />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="cursor-pointer">
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ProjectView(props: {workspace: string}) {
  let activeProject = useRecoilValue(atomActiveProject);

  return (
    <div className="flex-1 bg-white flex flex-col">
      <header className="shrink-0 border-b-2 border-gray-200 px-6">
        <div className="flex">
          <h2 className="text-lg font-semibold mr-1">{activeProject}</h2>
          <ProjectControls workspace={props.workspace} name={activeProject} />
        </div>
      </header>
    </div>
  );
}
