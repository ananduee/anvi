import { PlusIcon } from "@radix-ui/react-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useAtomValue } from "jotai";
import type { Project } from "../../state/client";
import {
  atomActiveProjectDetails,
  useUpdateProject,
} from "../../state/project";
import { useCallback, useRef, useState } from "react";
import SpinnerIcon from "../icons/SpinnerIcon";
import AddIcon from "../icons/AddIcon";

function AddNewStack(props: { project: Project; workspace: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  let [open, setOpen] = useState(false);
  let [projectState, updateProject] = useUpdateProject();
  let [formErr, setFormErr] = useState<string | null>(null);
  let onFormSubmit = useCallback(async () => {
    let value = inputRef.current?.value.trim();
    if (value && value.length > 0) {
      if (props.project?.stacks?.includes(value)) {
        setFormErr(`Stack with name ${value} already exists.`);
      } else {
        let updatedProject: Project = {
          ...props.project,
          stacks: [...(props.project.stacks ?? []), value],
        };
        setFormErr(null);
        await updateProject(props.workspace, updatedProject);
        setOpen(false);
      }
    } else {
      setFormErr("Please enter valid stack name");
    }
  }, [props.project, setFormErr, updateProject, props.workspace, setOpen]);
  let errToShow = formErr || projectState.err;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="w-80 border border-gray-200 p-2 cursor-pointer">
          <PlusIcon className="mx-auto w-7 h-7" />
          <p className="text-center">Add new stack</p>
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <Input ref={inputRef} placeholder="Stack name" />
        {errToShow ? (
          <p className="text-[0.8rem] text-red-600">{errToShow}</p>
        ) : null}
        <Button onClick={onFormSubmit} className="mt-1">
          {projectState.progress ? (
            <SpinnerIcon iconClass="text-white w-4 h-4" />
          ) : (
            "Create"
          )}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function KanbanColumn(props: { name: string }) {
  return (
    <div className="w-80 mr-2">
      <div className="bg-white p-2 border border-gray-200 flex justify-between">
        <p>{props.name}</p>
        <Dialog>
          <DialogTrigger>
            <div>
              <AddIcon iconClass="w-6- h-6 cursor-pointer" />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new task.</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function KanbanColumns(props: { workspace: string; project: Project }) {
  return (
    <>
      {props.project.stacks?.map((p) => {
        return <KanbanColumn key={p} name={p} />;
      })}
    </>
  );
}

export default function KanbanBoardView(props: { workspace: string }) {
  let projectDetails = useAtomValue(atomActiveProjectDetails);

  return (
    <div className="flex-1 overflow-auto bg-gray-100">
      <main className="p-3 inline-flex">
        <KanbanColumns workspace={props.workspace} project={projectDetails} />
        <AddNewStack project={projectDetails} workspace={props.workspace} />
      </main>
    </div>
  );
}
