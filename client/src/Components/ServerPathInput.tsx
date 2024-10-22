import { Controller } from 'react-hook-form';

import TextInput from './CommonComponents/TextInput';

export default function ServerPathInput() {
  return (
    <div className="mb-6">
      <h1 className="text-md font-medium mb-3 text-l-fg dark:text-d-fg">Path</h1>

      <Controller
        name="path"
        defaultValue=""
        rules={{ required: { value: true, message: 'Path required' } }}
        render={({ field: { onChange, value }, fieldState: { error }, formState }) => (
          <TextInput
            id="path"
            placeholder="Path"
            error={error}
            value={value}
            onChange={onChange}
          />
        )}
      />
    </div>
  );
}
