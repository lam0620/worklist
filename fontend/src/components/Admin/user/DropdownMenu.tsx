import React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { UUID } from "crypto";

interface DropdownMenuProps {
  userId: UUID;
  userPermissions: string[];
  isAdminUser: boolean;
}

const UserDropdownMenu = ({
  userId,
  userPermissions,
  isAdminUser,
}: DropdownMenuProps) => {
  const router = useRouter();

  const handleEdit = () => {
    // Logic to handle edit user
    console.log("Edit user:", userId);
  };

  const handleDelete = () => {
    // Logic to handle delete user
    console.log("Delete user:", userId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-full hover:bg-gray-200 focus:outline-none">
          <span className="sr-only">Open options</span>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h14M12 5l0 14"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2 bg-white border rounded shadow-lg">
        <DropdownMenuItem
          onSelect={handleEdit}
          disabled={!isAdminUser && !userPermissions.includes("change_user")}
          className={`p-2 ${
            !isAdminUser && !userPermissions.includes("change_user")
              ? "text-gray-400"
              : ""
          }`}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleDelete}
          disabled={!isAdminUser && !userPermissions.includes("delete_user")}
          className={`p-2 ${
            !isAdminUser && !userPermissions.includes("delete_user")
              ? "text-gray-400"
              : ""
          }`}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdownMenu;
