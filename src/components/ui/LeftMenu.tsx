import {
  useRecoilRefresher_UNSTABLE,
  useRecoilValue,
  useSetRecoilState,
} from "recoil";
import AddIcon from "../icons/AddIcon";
import { atomActiveProject, selectorProjects } from "../../state/project";
import React, {
  KeyboardEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";
import { tauriClient } from "../../state/client";
import { workspaceSelector } from "../../state/config";

function ProjectsList() {
  let projects = useRecoilValue(selectorProjects);
  let setActiveProject = useSetRecoilState(atomActiveProject);
  return (
    <React.Fragment>
      {projects.map((p) => {
        return (
          <div
            onClick={() => setActiveProject(p)}
            className="cursor-pointer hover:bg-gray-200 mb-2"
            key={p}
          >
            <p>{p}</p>
          </div>
        );
      })}
    </React.Fragment>
  );
}

function AddProjectInput(props: { hideProjectInput: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  let workspaceRoot = useRecoilValue(workspaceSelector);
  let projectsRefresher = useRecoilRefresher_UNSTABLE(selectorProjects);
  const [projectError, setProjectError] = useState<string | null>(null);

  let createProject = useCallback(
    async (name: string) => {
      setProjectError(null);
      try {
        await tauriClient.createProject(workspaceRoot!, name);
        projectsRefresher();
        props.hideProjectInput();
      } catch (err) {
        // @ts-ignore needed due to poor error handling.
        setProjectError(err.toString());
      }
    },
    [workspaceRoot, setProjectError, projectsRefresher, props.hideProjectInput]
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

function AddProjectButton() {
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
        <AddProjectInput hideProjectInput={toggleShowAddInput} />
      ) : null}
    </React.Fragment>
  );
}

export default function LeftMenu() {
  return (
    <div className="w-56 px-4 py-4 bg-gray-100 border-r overflow-auto">
      <nav className="mt-2">
        <AddProjectButton />
        <React.Suspense fallback={<div>Loading Projects...</div>}>
          <ProjectsList />
        </React.Suspense>
      </nav>
    </div>
  );
}
