import { Box, Button, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Owner } from "./ServerConfig";

export default function ServerOwner({
  onClearOwner,
  owner,
}: {
  onClearOwner: () => void;
  owner: Owner | null;
}) {
  if (owner) {
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
            {`Name : ${owner.name}`}
          </Typography>
          <Typography color="secondary.dark" variant="body1">
            {`Email : ${owner.email}`}
          </Typography>
        </Box>
      </>
    );
  } else {
    return (
      <>
        <Typography color="secondary.dark" variant="h5">
          Owner
        </Typography>
        <Box
          bgcolor={"primary.light"}
          sx={{
            padding: 1,
            width: "100%",
            marginY: 2,
            borderRadius: 2,
          }}
        >
          <Typography
            color="secondary.dark"
            variant="body1"
            sx={{ padding: 2 }}
          >
            No owner
          </Typography>
        </Box>
      </>
    );
  }
}
