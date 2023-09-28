import { atomActiveProject, useRefreshProjects } from "../../state/project";
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
import { useAtomCallback } from "jotai/utils";
import { useAtomValue } from "jotai";

function ProjectControls(props: { name: string; workspace: string }) {
  let refreshProjects = useRefreshProjects();

  const onDelete = useAtomCallback(useCallback(async (get, set) => {
    try {
      await tauriClient.deleteProject(props.workspace, props.name);
      // We need to reset active project and go back to selection mode.
      set(atomActiveProject, new Promise<string>(() => {}));
      // Also refresh projects list.
      refreshProjects();
    } catch (e) {
      console.error("Error while delete project", e);
    }
  }, [props.workspace, props.name, refreshProjects]));

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
  let activeProject = useAtomValue(atomActiveProject);

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
