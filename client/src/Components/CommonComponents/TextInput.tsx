import {
  Button,
  Checkbox,
  CustomFlowbiteTheme,
  TextInput as FBTextInput,
  Flowbite,
  Label,
  TextInputProps,
} from 'flowbite-react';
import { FieldError } from 'react-hook-form';

type Props = {
  error?: FieldError;
} & TextInputProps;

const customTheme: CustomFlowbiteTheme = {
  textInput: {
    field: {
      input: {
        colors: {
          gray: 'dark:bg-transparent bg-transparent border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500',
        },
      },
    },
  },
};

export default function TextInput({ error, ...props }: Props) {
  return (
    <div>
      <Flowbite theme={{ theme: customTheme }}>
        <FBTextInput {...props} />
      </Flowbite>

      {error ? <p className="text-xs text-red-800 mt-2">{error?.message}</p> : null}
    </div>
  );
}
