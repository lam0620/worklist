import * as Dialog from "@radix-ui/react-dialog";

interface BaseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  children: React.ReactNode;
}

const BaseDialog = ({
  isOpen,
  onOpenChange,
  title,
  children,
}: BaseDialogProps) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
      <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <Dialog.Title className="text-xl font-bold mb-4">{title}</Dialog.Title>
        {children}
        <Dialog.Close asChild>
          <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default BaseDialog;
