import { Button } from "@mui/material";

export default function SaveButton({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <Button
      variant="contained"
      onClick={onSubmit}
      sx={{
        marginTop: 10,
        width: 200,
        padding: 1,
        color: "white",
        alignSelf: "end",
      }}
      // color={"secondary"}
      size="large"
      disabled={disabled}
    >
      Save Changes
    </Button>
  );
}
