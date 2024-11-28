import { useEffect, useMemo, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { HiInformationCircle } from 'react-icons/hi';

import { Alert, useThemeMode } from 'flowbite-react';

import {
  GetServerInfo,
  UnclaimServer,
  UpdateServerName,
  UpdateServerPath,
} from '../ServerQueries';
import SaveButton from './SaveButton';
import ServerNameInput from './ServerNameInput';
import ServerOwner from './ServerOwner';
import ServerPath from './ServerPath';
import { ErrorServerUnreachable } from '../ServerQueries/ExceptionsManager';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../toastOverride.css';
import ServerPathInput from './ServerPathInput';

export type Owner = {
  name: string;
  email?: string;
};

export default function ServerConfig() {
  const [data, setData] = useState<GetServerInfo.ResponseType>();

  const ownerRemote = data?.ok ? data.data.owner : null;
  const ownerLocal = data?.ok ? data.data.ownerLocal : null;

  const owner = ownerRemote ?? ownerLocal;

  const themeMode = useThemeMode();

  const theme = themeMode.mode === 'auto' ? 'light' : themeMode.mode;

  const onException = (err: unknown) => {
    if (err instanceof ErrorServerUnreachable) {
      console.log('Server unreachable');
      toast.error('Cannot reach server, make sure it is running.');
    } else {
      console.log('Unexpected error');
      toast.error('Unexpected error');
    }
  };

  useEffect(() => {
    async function fetchData() {
      console.log('fetching data');
      try {
        const ret = await GetServerInfo.Post();

        if (!ret.ok) {
          console.log(ret);
          toast.error('Error fetching server info.');
          return;
        }

        setData(ret);
      } catch (err) {
        onException(err);
      }
    }
    fetchData();
  }, []);

  const onClearOwner = async () => {
    console.log('clear owner');

    try {
      const retUnclaimServer = await UnclaimServer.Post();

      if (!retUnclaimServer.ok) {
        console.log(retUnclaimServer);
        toast.error('Error removing server owner.');
        return;
      }

      const ret = await GetServerInfo.Post();

      if (!ret.ok) {
        console.log(ret);
        toast.error('Error fetching server info.');
        return;
      }

      setData(ret);
    } catch (err) {
      onException(err);
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
    console.log('onSubmit');

    if (data.name && data.path) {
      try {
        const updateNameRet = await UpdateServerName.Post({
          name: data.name,
        });

        const updatePathRes = await UpdateServerPath.Post({
          path: data.path,
        });

        if (!updateNameRet.ok) {
          console.log('error');

          if (updateNameRet.errorCode == 'INVALID_NAME') {
            toast.error('Error updating server name. Name contains some invalid characters.');
          } else {
            toast.error('Error updating server name.');
          }
          return;
        }

        if (!updatePathRes.ok) {
          console.log('error');

          if (updatePathRes.errorCode == 'PATH_ACCESS_DENIED') {
            toast.error('Error updating server path. Access denied to specified folder');
          } else if (updatePathRes.errorCode == 'PATH_FOLDER_DOES_NOT_EXIST') {
            toast.error('Error updating server path. Folder does not exist');
          } else if (updatePathRes.errorCode == 'PATH_NOT_ABSOLUTE') {
            toast.error('Error updating server path. Path needs to be absolute');
          } else {
            toast.error('Error updating server path.');
          }
          return;
        }

        toast.success('Server info saved.');
      } catch (err) {
        onException(err);
      }
    }
  };

  return (
    <div>
      <FormProvider {...methods}>
        <Title />
        <ServerNameInput />
        <ServerPathInput />
        <Alert
          color="gray"
          icon={HiInformationCircle}
          additionalContent={
            <div>
              Changing the server's folder won't move photos from the old one. To move them,
              you'll need to delete and re-upload them via the app.
            </div>
          }>
          <span className="font-bold">Warning</span>
        </Alert>
        <ServerOwner onClearOwner={onClearOwner} owner={owner} />
        <SaveButton disabled={false} onSubmit={methods.handleSubmit(onSubmit)} />
      </FormProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </div>
  );
}

function Title() {
  return (
    <h1 className="text-4xl text-l-fg dark:text-d-fg pb-10 font-medium text-center">
      Your Magpy server is running
    </h1>
  );
}
