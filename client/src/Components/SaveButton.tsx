import { Button } from 'flowbite-react';

export default function SaveButton({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-row justify-end mt-4">
      <Button
        disabled={disabled}
        onClick={onSubmit}
        className="bg-l-primary dark:bg-d-primary text-l-fg-primary dark:text-d-fg-primary">
        Save Changes
      </Button>
    </div>
  );
}
