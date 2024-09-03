import * as Avatar from "@radix-ui/react-avatar";
import { Checkbox } from "@radix-ui/themes";
import { PERMISSIONS } from "@/utils/constant";
import { UserDetailProps } from "@/app/types/UserDetail";

interface UserListProps {
  users: UserDetailProps[];
  onSelectUser: (userId: string) => void;
  onSelectUserForDelete: (userId: string, selected: boolean) => void;
  userPermissions: string[];
  isAdminUser: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedUsers: { [key: string]: boolean };
}

const UserList = ({
  users,
  onSelectUser,
  onSelectUserForDelete,
  userPermissions,
  isAdminUser,
  currentPage,
  totalPages,
  onPageChange,
  selectedUsers,
}: UserListProps) => {
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };
  const hasDeletePermission =
    (userPermissions ?? []).includes(PERMISSIONS.DELETE_ACCOUNT) || isAdminUser;

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-2 border-b bg-gray-100">
        <div className="w-2/12 font-semibold"></div>
        <div className="w-4/12 font-semibold">Full Name</div>
        <div className="w-2/12 font-semibold">Email</div>
        <div className="w-3/12 font-semibold">Role</div>
        <div className="w-2/12 font-semibold">Date Created</div>
      </div>
      <ul className="flex-grow">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between p-2 border-b"
          >
            <div className="w-1/12">
              <div className="flex items-center justify-center">
                {hasDeletePermission && (
                  <Checkbox
                    checked={!!selectedUsers[user.id]}
                    onCheckedChange={(checked) =>
                      onSelectUserForDelete(user.id, checked as boolean)
                    }
                    className="border-2 border-gray-400 rounded-sm h-4 w-4"
                  />
                )}
              </div>
            </div>
            <div
              className="flex w-5/12 cursor-pointer"
              onClick={() => onSelectUser(user.id)}
            >
              <Avatar.Root className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-800">
                <Avatar.Image
                  className="w-full h-full rounded-full"
                  src=""
                  alt="User avatar"
                />
                <Avatar.Fallback
                  className="flex items-center justify-center w-full h-full rounded-full text-white"
                  style={{ backgroundColor: user.avatar_color }}
                >
                  {`${user.first_name.charAt(0)}${user.last_name.charAt(0)}`}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="ml-4">
                <div className="">
                  {user.last_name} {user.first_name}
                </div>
              </div>
            </div>
            <div className="w-2/12 text-sm text-gray-500">{user.email}</div>
            <div className="w-3/12 flex flex-wrap gap-1">
              {Array.isArray(user.roles) &&
                user.roles.map((role) => (
                  <span
                    key={role.id.toString()}
                    className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full"
                  >
                    {role.name}
                  </span>
                ))}
            </div>
            <div className="w-2/12 text-sm text-gray-500">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-white py-4">
          <div className="flex justify-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 mx-1 rounded-md ${
                  index + 1 === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
