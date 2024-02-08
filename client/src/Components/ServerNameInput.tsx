import { Typography } from '@mui/material';
import { Label } from 'flowbite-react';
import { Controller } from 'react-hook-form';

import TextInput from './CommonComponents/TextInput';

export default function ServerNameInput() {
  return (
    <div className="my-4">
      <h1 className="text-sm font-medium mb-2 text-l-fg dark:text-d-fg">Server name</h1>
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
