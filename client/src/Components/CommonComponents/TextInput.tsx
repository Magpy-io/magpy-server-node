import { Box, TextField, TextFieldProps } from "@mui/material";

export default function TextInput(props: TextFieldProps) {
  return (
    <Box sx={{ width: "100%", marginY: 2 }}>
      <TextField {...props} />
    </Box>
  );
}
