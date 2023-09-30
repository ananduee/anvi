import {
  atomActiveProject,
  loadableActiveProject,
  useRefreshProjects,
} from "../../state/project";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Suspense, useCallback, useState } from "react";
import { tauriClient } from "../../state/client";
import { useAtomCallback } from "jotai/utils";
import { useAtomValue } from "jotai";
import { ChevronDownIcon, ReaderIcon } from "@radix-ui/react-icons";
import KanbanBoardView from "./KanbanBoardView";

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

function ProjectHeaderRow(props: { workspace: string; name: string }) {
  return (
    <div className="flex">
      <h2 className="text-lg font-semibold mr-1">{props.name}</h2>
      <ProjectControls workspace={props.workspace} name={props.name} />
    </div>
  );
}

function ProjectControlRow(props: { workspace: string; name: string }) {
  return (
    <div className="flex pb-1">
      <div className="cursor-pointer border-b-2 border-blue-600	">
        <ReaderIcon className="inline-block align-middle" />{" "}
        <span className="inline-block align-middle">Board</span>
      </div>
    </div>
  );
}

export default function ProjectView(props: { workspace: string }) {
  let activeProjectState = useAtomValue(loadableActiveProject);
  let activeProject =
    activeProjectState.state == "hasData" ? activeProjectState.data : null;

  if (activeProject == null) {
    return <p className="ml-2">Please select active project.</p>;
  }

  return (
    <div className="flex-1 bg-white flex flex-col">
      <header className="shrink-0 border-b-2 border-gray-200 px-6">
        <ProjectHeaderRow workspace={props.workspace} name={activeProject} />
        <ProjectControlRow workspace={props.workspace} name={activeProject} />
      </header>
      <Suspense fallback={<p>Loading...</p>}>
        <KanbanBoardView workspace={props.workspace} />
      </Suspense>
    </div>
  );
}
