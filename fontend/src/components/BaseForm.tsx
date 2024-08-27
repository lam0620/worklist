import * as Form from "@radix-ui/react-form";

interface BaseFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  includeCancelButton?: boolean;
}

const BaseForm = ({
  onSubmit,
  children,
  includeCancelButton = true,
}: BaseFormProps) => {
  return (
    <Form.Root onSubmit={onSubmit}>
      {children}
      <div className="flex justify-end space-x-2 mt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Submit
        </button>
        {includeCancelButton && (
          <button type="button" className="px-4 py-2 bg-gray-200 rounded-md">
            Cancel
          </button>
        )}
      </div>
    </Form.Root>
  );
};

export default BaseForm;
