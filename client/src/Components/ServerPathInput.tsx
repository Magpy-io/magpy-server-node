import { Box, Typography } from '@mui/material';
import { Label } from 'flowbite-react';
import { Controller } from 'react-hook-form';

import TextInput from './CommonComponents/TextInput';

export default function ServerPathInput({ onClearPhotos }: { onClearPhotos: () => void }) {
  return (
    <div className="my-4">
      <h1 className="text-sm font-medium mb-2 text-l-fg dark:text-d-fg">Path</h1>

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
