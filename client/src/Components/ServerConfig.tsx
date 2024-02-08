import React, { useEffect, useMemo, useState } from 'react';

import { Alert } from 'flowbite-react';
import { cache } from 'joi';
import { FormProvider, useForm } from 'react-hook-form';
import { HiInformationCircle } from 'react-icons/hi';

import {
  GetServerInfo,
  UnclaimServer,
  UpdateServerName,
  UpdateServerPath,
} from '../ServerQueries';
import { ServerResponseError } from '../ServerQueries/Types/ApiGlobalTypes';
import SaveButton from './SaveButton';
import ServerNameInput from './ServerNameInput';
import ServerOwner from './ServerOwner';
import ServerPathInput from './ServerPathInput';

export type Owner = {
  name: string;
  email: string;
};

type ErrorTypes =
  | UpdateServerPath.ResponseErrorTypes
  | UpdateServerName.ResponseErrorTypes
  | UnclaimServer.ResponseErrorTypes;

export default function ServerConfig() {
  const [data, setData] = useState<GetServerInfo.ResponseType>();
  const [failedRequests, setFailedRequests] = useState<string[]>([]);

  const owner = data?.ok ? data.data.owner : null;

  console.log('failedRequests', failedRequests);

  const setError = () =>
    setFailedRequests(prev => {
      return [...prev, 'Error'];
    });

  useEffect(() => {
    async function fetchData() {
      try {
        const ret = await GetServerInfo.Post();
        setData(ret);
      } catch {
        setError();
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    console.log('failedRequest useEffect', failedRequests);
  }, [failedRequests]);

  const onClearPhotos = () => {
    console.log('clear photos');
  };

  const onClearOwner = async () => {
    console.log('clear owner');
    const unclaimRes = await UnclaimServer.Post().catch(console.log);
    if (unclaimRes && !unclaimRes.ok) {
      setFailedRequests(prev => {
        prev.push(unclaimRes.errorCode);
        return prev;
      });
    }
    if (unclaimRes && unclaimRes.ok) {
      const ret = await GetServerInfo.Post().catch(console.log);
      if (ret) setData(ret);
    }
  };

  const initialValues = useMemo(() => {
    return {
      name: data?.ok ? data?.data?.serverName : '',
      path: data?.ok ? data?.data?.storagePath : '',
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
      try {
        const updateNameRes = await UpdateServerName.Post({
          name: data.name,
        });
        const updatePathRes = await UpdateServerPath.Post({
          path: data.path,
        });
        if (updateNameRes && !updateNameRes.ok) {
          setFailedRequests(prev => {
            prev.push(updateNameRes.errorCode);
            return prev;
          });
        }
        if (updatePathRes && !updatePathRes.ok) {
          setFailedRequests(prev => {
            prev.push(updatePathRes.errorCode);
            return prev;
          });
        }
      } catch {
        setError();
      }
    }
  };

  const hasFailedRequests = failedRequests.length > 0;
  const errorMessage = failedRequests?.[0] + ` `;

  return (
    <div>
      <FormProvider {...methods}>
        <Title />
        <ServerNameInput />
        <ServerPathInput onClearPhotos={onClearPhotos} />
        <ServerOwner onClearOwner={onClearOwner} owner={owner} />
        <SaveButton disabled={false} onSubmit={methods.handleSubmit(onSubmit)} />
      </FormProvider>
      {/* {hasFailedRequests && (
        <Alert color="failure" icon={HiInformationCircle}>
          <span className="font-medium">Something went wrong : </span> {errorMessage}
        </Alert>
      )} */}
    </div>
  );
}

function Title() {
  return <h1 className="text-3xl  text-l-fg dark:text-d-fg">Your Magpy server</h1>;
}
