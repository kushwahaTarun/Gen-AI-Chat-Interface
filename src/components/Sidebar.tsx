"use client";
import { cn } from "@/lib/util";
import React, { createContext, useContext } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { useSelector, useDispatch } from "react-redux";
import { TbEdit } from "react-icons/tb";

import coffee from "../../public/coffee.png";
import useMessageActions from "@/hooks/useMessageActions";
import { setIsSidebarOpen } from "@/features/chatInterfaceSlice";
import { RootState } from "@/store/store";

interface Links {
  label: string;
  clickEvent: "handleNewChat";
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const { isSidebarOpen } = useSelector((state: RootState) => state.chat);

  const dispatch = useDispatch();
  const open = openProp !== undefined ? openProp : isSidebarOpen;
  interface SetOpenFunction {
    (value: boolean | ((prevState: boolean) => boolean)): void;
  }

  const setOpen: SetOpenFunction =
    setOpenProp !== undefined
      ? setOpenProp
      : (value) => {
          // value can be boolean or a function returning boolean
          const newValue: boolean =
            typeof value === "function" ? value(isSidebarOpen) : value;
          dispatch(setIsSidebarOpen(newValue));
        };

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden  md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] shrink-0",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  const { messages } = useSelector((state: RootState) => state.chat);
  const { handleNewChat } = useMessageActions();
  return (
    <>
      <div
        className={cn(
          "h-10 px-2 py-4 flex flex-row md:hidden items-center justify-between bg-transparent w-full"
        )}
        {...props}
      >
        <div className="flex justify-between z-20 w-full">
          <div className="flex items-center">
            <IconMenu2
              className="text-neutral-800 dark:text-neutral-200"
              onMouseOver={() => setOpen(!open)}
            />
            <span className="ml-2">BAANGDU</span>
          </div>

          {messages.length ? (
            <div className="flex justify-center items-center gap-x-2">
              {/* Buy me a coffee button */}
              <a
                href="https://www.buymeacoffee.com/tarunkushwaha"
                target="_blank"
              >
                <Image
                  src={coffee}
                  alt="Buy Me A Coffee"
                  height="30"
                  className="h-[24px] w-[22px] p-1 bg-white rounded-[50%]"
                />
              </a>
              {/* New chat button  */}
              <TbEdit
                className="text-xl"
                title="New chat"
                onClick={handleNewChat}
              />
            </div>
          ) : null}
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();

  const { handleNewChat } = useMessageActions();

  // an object containing your functions
  const functionMap = { handleNewChat };

  return (
    <div
      className={cn(
        "flex items-center justify-start gap-2  group/sidebar py-2 cursor-pointer",
        className
      )}
      onClick={() =>
        functionMap[link.clickEvent] && functionMap[link.clickEvent]()
      }
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </div>
  );
};
