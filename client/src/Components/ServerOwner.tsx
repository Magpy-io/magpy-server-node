import { Box, Button, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function ServerOwner({
  onClearOwner,
}: {
  onClearOwner: () => void;
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
          Owner
        </Typography>
        <Button
          endIcon={<DeleteIcon />}
          variant="text"
          color="error"
          onClick={onClearOwner}
        >
          Remove owner
        </Button>
      </Box>

      <Box
        bgcolor={"primary.light"}
        sx={{
          padding: 2,
          width: "100%",
          marginY: 2,
          borderRadius: 2,
        }}
      >
        <Typography color="secondary.dark" variant="body1">
          Name : Chaimaa
        </Typography>
        <Typography color="secondary.dark" variant="body1">
          Email : chaimaa.elassad@gmail.com
        </Typography>
      </Box>
    </>
  );
}
