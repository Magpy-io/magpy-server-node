import { Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import TextInput from "./CommonComponents/TextInput";

export default function ServerNameInput() {
  return (
    <>
      <Typography variant="h5" color="secondary.dark">
        Server Name
      </Typography>
      <Controller
        name="name"
        defaultValue=""
        rules={{
          required: { value: true, message: "Server name required" },
          minLength: {
            value: 3,
            message: "Should be at least 3 characters long",
          },
        }}
        render={({
          field: { onChange, value },
          fieldState: { error },
          formState,
        }) => (
          <TextInput
            id="name"
            placeholder="Server Name"
            variant="outlined"
            fullWidth
            value={value}
            onChange={onChange}
            error={!!error}
            helperText={error ? error.message : null}
          />
        )}
      />
    </>
  );
}
