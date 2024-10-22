import { Controller } from 'react-hook-form';

import TextInput from './CommonComponents/TextInput';

export default function ServerPath({ path }: { path: string }) {
  return (
    <div className="mb-3">
      <h1 className="text-md font-medium mb-3  text-l-fg dark:text-d-fg">Path</h1>
      <div className="p-4 bg-l-bg-light dark:bg-d-bg-light rounded-lg">
        <h1 className="text-sm font-medium  text-l-fg dark:text-d-fg">{path}</h1>
      </div>
    </div>
  );
}
