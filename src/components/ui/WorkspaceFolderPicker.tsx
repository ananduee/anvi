import { useCallback } from "react";
import { useWorkspaceFolderPicker, workspaceSelector } from "../../state/config";
import FolderIcon from "../icons/FolderIcon";
import { useRecoilRefresher_UNSTABLE } from "recoil";

export default function WorkspaceFolderPicker() {
  const folderPickerCallback = useWorkspaceFolderPicker();
  const refreshFolder = useRecoilRefresher_UNSTABLE(workspaceSelector);
  const onPickerClick = useCallback(async () => {
    let res = await folderPickerCallback();
    if (res) {
      refreshFolder();
    }
  }, [folderPickerCallback])
  return (
    <div className="mx-auto my-auto">
      <button onClick={onPickerClick} className="bg-indigo-500 text-white py-2 px-3 rounded-md text-sm">
        <FolderIcon iconClass="w-5 h-5 inline-flex mr-2" />
        Pick workspace folder
      </button>
    </div>
  );
}
