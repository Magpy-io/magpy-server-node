import { Button } from 'flowbite-react';

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
      <>
        <div className="flex flex-row justify-between">
          <h1 className="text-sm font-medium mb-2  text-l-fg dark:text-d-fg">Owner</h1>
          <Button
            outline
            color="white"
            className="text-l-fg dark:text-d-fg"
            size="xs"
            onClick={onClearOwner}>
            Remove owner
          </Button>
        </div>
        <div className="p-4 bg-slate-100 rounded-lg bg-l-bg-light dark:bg-d-bg-light">
          <h1 className="text-sm font-medium text-l-fg dark:text-d-fg pb-1">{`Name : ${owner.name}`}</h1>
          <h1 className="text-sm font-medium text-l-fg dark:text-d-fg">{`Email : ${owner.email}`}</h1>
        </div>
      </>
    );
  } else {
    return (
      <>
        <h1 className="text-sm font-medium mb-2  text-l-fg dark:text-d-fg">Owner</h1>
        <div className="p-4 bg-l-bg-light dark:bg-d-bg-light rounded-lg">
          <h1 className="text-sm font-medium  text-l-fg dark:text-d-fg">No owner</h1>
        </div>
      </>
    );
  }
}
