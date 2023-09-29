import { PlusIcon } from "@radix-ui/react-icons";

function AddNewStack() {
  return (
    <div className="w-80 border border-gray-200 p-2 cursor-pointer">
      <PlusIcon className="mx-auto w-7 h-7" />
      <p className="text-center">Add new stack</p>
    </div>
  );
}

export default function KanbanBoardView() {
  return (
    <div className="flex-1 overflow-auto">
      <main className="p-3 inline-flex">
        <AddNewStack />
      </main>
    </div>
  );
}
