"use client";

import Image from "next/image";
import { Sidebar, SidebarBody, SidebarLink } from "./Sidebar";
import { MdOutlineAddCircle } from "react-icons/md";
import { signOut, getAuth } from "firebase/auth";

import user from "../../../public/user.png";
import { useSidebar } from "./Sidebar";

export default function AppSidebar() {
  // Get the current user from Firebase authentication
  const auth = getAuth();

  const data = useSidebar();
  console.warn("data from useSidebar:", data);

  // Define the links for the sidebar
  const links = [
    {
      label: "New chat",
      clickEvent: "handleNewChat",
      icon: (
        <MdOutlineAddCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0" />
      ),
    },
  ];

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <div className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <span className="font-medium text-black dark:text-white whitespace-pre">
              Baangdu AI
            </span>
          </div>
          {/* Navigation Links */}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>

          {/* Section that will display the conversation history of the user */}
          <section className="mt-8">
            <div className="text-xs">Recent Conversations</div>
          </section>

          {/* Section that will display the user profile and the settings option */}
          <section className="absolute bottom-3 left-2.5 text-center block">
            {/* Profile icon on the page */}
            <Image
              id="dropdownUserAvatarButton"
              className="cursor-pointer hover:opacity-80 transition-opacity rounded-full border-2 border-gray-700 hover:border-blue-500"
              data-dropdown-toggle="dropdownAvatar"
              src={auth.currentUser?.photoURL || user}
              height={40}
              width={40}
              onClick={() => signOut(auth)}
              alt="profile icon"
            />
          </section>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
