import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { VscFilePdf } from "react-icons/vsc";
import { BsMarkdown, BsFiletypeDocx } from "react-icons/bs";
import { TbFileExport } from "react-icons/tb";

import { useExportChat } from "@/hooks/useExportChat";

interface propsType {
  currentAiResponse: {
    [key: string]: string | boolean;
  };
}

export default function ExportMsgBtn({ currentAiResponse }: propsType) {
  console.warn("currentAiResponse", currentAiResponse);

  // importing a function from the custom hook
  const { exportToPDF, exportToMarkdown, exportToDocx } = useExportChat();

  return (
    <Menu>
      {/* Export Btn */}
      <MenuButton className="text-gray-400 text-sm hover:text-white flex items-center cursor-pointer rounded-xl px-2 hover:bg-gray-800">
        <TbFileExport className="text-base mr-1" />
        Export
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom"
        className="w-40 z-10 origin-top-right rounded-xl border border-white/5 bg-white/5 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0 "
      >
        {/* PDF Btn */}
        <MenuItem>
          <button
            onClick={() => exportToPDF(currentAiResponse)}
            className="cursor-pointer group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-white/10"
          >
            <VscFilePdf className="size-4 fill-white opacity-95" />
            PDF
            <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-focus:inline">
              ⌘E
            </kbd>
          </button>
        </MenuItem>
        {/* Markdown Btn */}
        <MenuItem>
          <button
            onClick={() => exportToMarkdown(currentAiResponse)}
            className="cursor-pointer group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-white/10"
          >
            <BsMarkdown className="size-4 fill-white" />
            Markdown
            <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-focus:inline">
              ⌘E
            </kbd>
          </button>
        </MenuItem>
        {/* Docx Btn */}
        <MenuItem>
          <button
            className="cursor-pointer group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-white/10"
            onClick={() => exportToDocx(currentAiResponse)}
          >
            <BsFiletypeDocx className="size-4 fill-white" />
            DOCX
            <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-focus:inline">
              ⌘E
            </kbd>
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
