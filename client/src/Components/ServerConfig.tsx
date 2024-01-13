import { Alert, AlertTitle, Box, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import ServerNameInput from "./ServerNameInput";
import ServerPathInput from "./ServerPathInput";
import ServerOwner from "./ServerOwner";
import SaveButton from "./SaveButton";
import {
  GetServerInfoPost,
  GetServerInfoResponseType,
  ServerResponseError,
  UnclaimServerPost,
  UnclaimServerResponseErrorTypes,
  UpdateServerNamePost,
  UpdateServerNameResponseErrorTypes,
  UpdateServerPathPost,
  UpdateServerPathResponseErrorTypes,
} from "../ServerImportedQueries";

export type Owner = {
  name: string;
  email: string;
};

type ErrorTypes =
  | UpdateServerPathResponseErrorTypes
  | UpdateServerNameResponseErrorTypes
  | UnclaimServerResponseErrorTypes;

export default function ServerConfig() {
  const [hasChanges, setHasChanges] = useState(false);

  const [data, setData] = useState<GetServerInfoResponseType>();
  const [failedRequests, setFailedRequests] = useState<
    ServerResponseError<ErrorTypes>[]
  >([]);

  const owner = data?.ok ? data.data.owner : null;

  console.log("failedRequests", failedRequests);

  useEffect(() => {
    async function fetchData() {
      const ret = await GetServerInfoPost();
      setData(ret);
    }
    fetchData().catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    console.log("failedRequest useEffect", failedRequests);
  }, [failedRequests]);

  const onClearPhotos = () => {
    console.log("clear photos");
  };

  const onClearOwner = async () => {
    console.log("clear owner");
    const unclaimRes = await UnclaimServerPost().catch(console.log);
    if (unclaimRes && !unclaimRes.ok) {
      setFailedRequests((prev) => {
        prev.push(unclaimRes);
        return prev;
      });
    }
    if (unclaimRes && unclaimRes.ok) {
      const ret = await GetServerInfoPost().catch(console.log);
      if (ret) setData(ret);
    }
  };

  const initialValues = useMemo(() => {
    return {
      name: data?.ok ? data?.data?.serverName : "",
      path: data?.ok ? data?.data?.storagePath : "",
    };
  }, [data]);

  const methods = useForm({
    defaultValues: initialValues,
  });

  useEffect(() => {
    methods.reset(initialValues);
  }, [initialValues, methods]);

  const onSubmit = async (data: {
    name: string | undefined | false;
    path: string | undefined | false;
  }) => {
    console.log(data);
    if (data.name && data.path) {
      const updateNameRes = await UpdateServerNamePost({
        name: data.name,
      }).catch(console.log);
      const updatePathRes = await UpdateServerPathPost({
        path: data.path,
      }).catch(console.log);
      console.log("updateNameRes", updateNameRes);
      if (updateNameRes && !updateNameRes.ok) {
        setFailedRequests((prev) => {
          prev.push(updateNameRes);
          return prev;
        });
      }
      if (updatePathRes && !updatePathRes.ok) {
        setFailedRequests((prev) => {
          prev.push(updatePathRes);
          return prev;
        });
      }
      console.log(failedRequests);
    }
  };

  const hasFailedRequests = failedRequests.length > 0;
  const errorMessage = failedRequests.reduce(
    (prev, value) => prev + " " + value.errorCode,
    ""
  );

  return (
    <Box
      bgcolor={"white"}
      flex={1}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        paddingY: 10,
        paddingX: 10,
        minHeight: "90vh",
        maxWidth: "40%",
        borderRadius: 10,
      }}
    >
      <FormProvider {...methods}>
        <Title />
        <ServerNameInput />
        <ServerPathInput onClearPhotos={onClearPhotos} />
        <ServerOwner onClearOwner={onClearOwner} owner={owner} />
        <SaveButton
          disabled={false}
          onSubmit={methods.handleSubmit(onSubmit)}
        />
      </FormProvider>
      {hasFailedRequests && (
        <Alert sx={{ width: "100%", marginTop: 6 }} severity="error">
          <AlertTitle>Error</AlertTitle>
          Something went wrong :<strong>{errorMessage}</strong>
        </Alert>
      )}
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
