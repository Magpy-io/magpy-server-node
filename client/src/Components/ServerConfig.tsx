import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import ServerNameInput from "./ServerNameInput";
import ServerPathInput from "./ServerPathInput";
import ServerOwner from "./ServerOwner";
import SaveButton from "./SaveButton";

export default function ServerConfig() {
  const [hasChanges, setHasChanges] = useState(false);

  const onClearPhotos = () => {
    console.log("clear photos");
  };

  const onClearOwner = () => {
    console.log("clear owner");
  };

  const methods = useForm();
  const onSubmit = (data: any) => console.log(data);
  return (
    <Box
      bgcolor={"white"}
      flex={1}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        paddingY: 10,
        paddingX: 15,
        minHeight: "90vh",
        maxWidth: "40%",
        borderRadius: 10,
      }}
    >
      <FormProvider {...methods}>
        <Title />
        <ServerNameInput />
        <ServerPathInput onClearPhotos={onClearPhotos} />
        <ServerOwner onClearOwner={onClearOwner} />
        <SaveButton
          disabled={false}
          onSubmit={methods.handleSubmit(onSubmit)}
        />
      </FormProvider>
    </Box>
  );
}

function Title() {
  return (
    <Typography
      variant="h3"
      gutterBottom
      sx={{ marginBottom: 6, textAlign: "center" }}
      color="secondary.dark"
    >
      Your OpenCloud server
    </Typography>
  );
}
