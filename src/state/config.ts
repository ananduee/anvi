import { useCallback } from "react";
import { atom, useRecoilState } from "recoil";
import { open } from '@tauri-apps/api/dialog';


export const atomWorkspaceFolder = atom<null | string>({
  key: "atomRootFolder",
  default: null
})

export function useWorkspaceFolderPicker() {
  let [currentFolder, folderSetter] = useRecoilState(atomWorkspaceFolder);
  const folderPickerCallback = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: currentFolder ?? undefined,
      title: "Pick workspace folder"
    });
    if (selected != null) {
      folderSetter(Array.isArray(selected) ? selected[0] : selected);
    }
  }, [currentFolder, folderSetter])
  return [currentFolder, folderPickerCallback]
}
