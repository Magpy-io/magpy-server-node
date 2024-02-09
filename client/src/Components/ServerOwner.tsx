import { Button, CustomFlowbiteTheme } from 'flowbite-react';

import { Owner } from './ServerConfig';

export default function ServerOwner({
  onClearOwner,
  owner,
}: {
  onClearOwner: () => void;
  owner: Owner | null;
}) {
  if (owner) {
    return (
      <div className="mb-8">
        <div className="flex flex-row justify-between items-center mb-3">
          <h1 className="text-md font-medium  text-l-fg dark:text-d-fg">Owner</h1>
          <Button
            color="transparent"
            pill
            className="font-medium"
            size="xs"
            onClick={onClearOwner}>
            Remove owner
          </Button>
        </div>
        <div className="p-4 bg-slate-100 rounded-lg bg-l-bg-light dark:bg-d-bg-light">
          <h1 className="text-sm font-medium text-l-fg dark:text-d-fg pb-1">{`Name : ${owner.name}`}</h1>
          <h1 className="text-sm font-medium text-l-fg dark:text-d-fg">{`Email : ${owner.email}`}</h1>
        </div>
      </div>
    );
  } else {
    return (
      <div className="mb-8">
        <h1 className="text-md font-medium mb-3  text-l-fg dark:text-d-fg">Owner</h1>
        <div className="p-4 bg-l-bg-light dark:bg-d-bg-light rounded-lg">
          <h1 className="text-sm font-medium  text-l-fg dark:text-d-fg">No owner</h1>
        </div>
      </div>
    );
  }
}
