import { Box, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import TextInput from "./CommonComponents/TextInput";

export default function ServerPathInput({
  onClearPhotos,
}: {
  onClearPhotos: () => void;
}) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Typography color="secondary.dark" variant="h5">
          Path
        </Typography>
      </Box>
      <Typography color="secondary.dark" variant="body1">
        This is where your photos are stored
      </Typography>

      <Controller
        name="path"
        defaultValue=""
        rules={{ required: { value: true, message: "Path required" } }}
        render={({
          field: { onChange, value },
          fieldState: { error },
          formState,
        }) => (
          <TextInput
            id="path"
            placeholder="Path"
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
