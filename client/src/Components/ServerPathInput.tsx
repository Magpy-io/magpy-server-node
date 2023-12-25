import { Box, Button, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import TextInput from "./CommonComponents/TextInput";
import DeleteIcon from "@mui/icons-material/Delete";

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
        <Button
          endIcon={<DeleteIcon />}
          variant="text"
          color="error"
          onClick={onClearPhotos}
        >
          Clear Photos
        </Button>
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
