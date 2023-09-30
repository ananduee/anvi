import AddIcon from "../icons/AddIcon";
import {
  atomActiveProject,
  atomProjects,
  loadableActiveProject,
  useRefreshProjects,
} from "../../state/project";
import React, {
  KeyboardEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";
import { tauriClient } from "../../state/client";
import { useAtomValue, useSetAtom } from "jotai";
import clsx from "clsx";

function ProjectsList() {
  let projects = useAtomValue(atomProjects);
  let setActiveProject = useSetAtom(atomActiveProject);
  let activeProject = useAtomValue(loadableActiveProject);
  let activeProjectName =
    activeProject.state == "hasData" ? activeProject.data : null;
  return (
    <React.Fragment>
      {projects.map((p) => {
        let isActive = activeProjectName == p;
        return (
          <div
            onClick={() => {
              console.log("setting active project", p);
              setActiveProject(p);
            }}
            className={clsx({
              "cursor-pointer  mb-2": true,
              "hover:bg-gray-200": !isActive,
              "bg-white border border-gray-100": isActive,
            })}
            key={p}
          >
            <p>{p}</p>
          </div>
        );
      })}
    </React.Fragment>
  );
}

function AddProjectInput(props: {
  hideProjectInput: () => void;
  workspace: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  let projectsRefresher = useRefreshProjects();
  const [projectError, setProjectError] = useState<string | null>(null);

  let createProject = useCallback(
    async (name: string) => {
      setProjectError(null);
      try {
        await tauriClient.createProject(props.workspace, name);
        projectsRefresher();
        props.hideProjectInput();
      } catch (err) {
        // @ts-ignore needed due to poor error handling.
        setProjectError(err.toString());
      }
    },
    [
      props.workspace,
      setProjectError,
      projectsRefresher,
      props.hideProjectInput,
    ]
  );

  let onKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key == "Escape") {
        props.hideProjectInput();
      } else if (e.key == "Enter") {
        let txtValue = inputRef.current?.value.trim();
        if (txtValue && txtValue.length > 0) {
          createProject(txtValue);
        }
      }
    },
    [props.hideProjectInput, createProject]
  );

  return (
    <div className="mb-2">
      <input
        ref={inputRef}
        onKeyDown={onKeyDown}
        autoFocus
        type="text"
        placeholder="Project name"
      />
      {projectError != null ? (
        <p className="text-red-600">{projectError}</p>
      ) : null}
    </div>
  );
}

function AddProjectButton(props: { workspace: string }) {
  let [showAddInput, setShowAddInput] = useState(false);
  const toggleShowAddInput = useCallback(() => {
    setShowAddInput((v) => {
      return !v;
    });
  }, [setShowAddInput]);
  return (
    <React.Fragment>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-600">Projects</h3>
        <span
          onClick={toggleShowAddInput}
          className="text-gray-700 cursor-pointer"
        >
          <AddIcon iconClass="w-5 h-5" />
        </span>
      </div>
      {showAddInput ? (
        <AddProjectInput
          workspace={props.workspace}
          hideProjectInput={toggleShowAddInput}
        />
      ) : null}
    </React.Fragment>
  );
}

export default function LeftMenu(props: { workspace: string }) {
  return (
    <div className="sticky left-0 w-56 min-w-[14rem] px-4 py-4 bg-gray-200 border-r overflow-auto">
      <nav className="mt-2">
        <AddProjectButton workspace={props.workspace} />
        <React.Suspense fallback={<div>Loading Projects...</div>}>
          <ProjectsList />
        </React.Suspense>
      </nav>
    </div>
  );
}
