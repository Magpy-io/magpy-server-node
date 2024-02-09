import { Controller } from 'react-hook-form';

import TextInput from './CommonComponents/TextInput';

export default function ServerNameInput() {
  return (
    <div className="mb-6">
      <h1 className="text-md font-medium mb-3 text-l-fg dark:text-d-fg">Server name</h1>
      <Controller
        name="name"
        defaultValue=""
        rules={{
          required: { value: true, message: 'Server name required' },
          // minLength: {
          //   value: 3,
          //   message: "Should be at least 3 characters long",
          // },
        }}
        render={({ field: { onChange, value }, fieldState: { error }, formState }) => (
          <TextInput
            id="name"
            placeholder="Server Name"
            value={value}
            onChange={onChange}
            error={error}
          />
        )}
      />
    </div>
  );
}
