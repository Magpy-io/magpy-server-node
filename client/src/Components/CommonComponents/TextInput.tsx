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

export default function TextInput({ error, ...props }: Props) {
  return (
    <div>
      <FBTextInput {...props} />

      {error ? <p className="text-xs text-red-800 mt-2">{error?.message}</p> : null}
    </div>
  );
}
