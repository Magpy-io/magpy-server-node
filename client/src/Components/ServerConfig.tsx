import { useEffect, useMemo, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

import { useThemeMode } from 'flowbite-react';

import { GetServerInfo, UnclaimServer, UpdateServerName } from '../ServerQueries';
import SaveButton from './SaveButton';
import ServerNameInput from './ServerNameInput';
import ServerOwner from './ServerOwner';
import ServerPath from './ServerPath';
import { ErrorServerUnreachable } from '../ServerQueries/ExceptionsManager';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../toastOverride.css';

export type Owner = {
  name: string;
  email?: string;
};

export default function ServerConfig() {
  const [data, setData] = useState<GetServerInfo.ResponseType>();

  const ownerRemote = data?.ok ? data.data.owner : null;
  const ownerLocal = data?.ok ? data.data.ownerLocal : null;
  const serverPath = data?.ok ? data.data.storagePath : 'Path not found';

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

  const onSubmit = async (data: { name: string | undefined | false }) => {
    console.log('onSubmit');

    if (data.name) {
      try {
        const updateNameRet = await UpdateServerName.Post({
          name: data.name,
        });

        if (!updateNameRet.ok) {
          console.log('error');

          if (updateNameRet.errorCode === 'INVALID_NAME') {
            toast.error('Error updating server name. Name is not valid.');
          } else {
            toast.error('Error updating server name.');
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
        <ServerPath path={serverPath} />
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
