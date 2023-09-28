import { atomActiveProject, useRefreshProjects } from "../../state/project";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback, useState } from "react";
import { tauriClient } from "../../state/client";
import { useAtomCallback } from "jotai/utils";
import { useAtomValue } from "jotai";
import { ChevronDownIcon } from "@radix-ui/react-icons";

function ProjectControls(props: { name: string; workspace: string }) {
  let refreshProjects = useRefreshProjects();
  let [open, setOpen] = useState(false);

  const onDelete = useAtomCallback(
    useCallback(
      async (_get, set) => {
        try {
          setOpen(false);
          // Send escape key to hide project.
          await tauriClient.deleteProject(props.workspace, props.name);
          // Also refresh projects list.
          refreshProjects();
          // We need to reset active project and go back to selection mode.
          set(atomActiveProject, new Promise<string>(() => {}));
        } catch (e) {
          console.error("Error while delete project", e);
        }
      },
      [props.workspace, props.name, refreshProjects, setOpen]
    )
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild={true} className="focus:outline-none">
        <ChevronDownIcon className="w-6 h-6 cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent hideWhenDetached={true} className="cursor-pointer">
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ProjectView(props: { workspace: string }) {
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
