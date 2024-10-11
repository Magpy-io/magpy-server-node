import { useEffect, useMemo, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

import { GetServerInfo, UnclaimServer, UpdateServerName } from '../ServerQueries';
import SaveButton from './SaveButton';
import ServerNameInput from './ServerNameInput';
import ServerOwner from './ServerOwner';
import ServerPath from './ServerPath';
import { ErrorServerUnreachable } from '../ServerQueries/ExceptionsManager';

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

  useEffect(() => {
    async function fetchData() {
      console.log('fetching data');
      try {
        const ret = await GetServerInfo.Post();

        if (!ret.ok) {
          console.log(ret);
          return;
        }

        setData(ret);
      } catch (err) {
        if (err instanceof ErrorServerUnreachable) {
          console.log('server not responding');
        } else {
          console.log('unexpected error');
        }
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
        return;
      }

      const ret = await GetServerInfo.Post();

      if (!ret.ok) {
        console.log(ret);
        return;
      }

      setData(ret);
    } catch (err) {
      if (err instanceof ErrorServerUnreachable) {
        console.log('server not responding');
      } else {
        console.log('unexpected error');
      }
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
          return;
        }
      } catch (err) {
        if (err instanceof ErrorServerUnreachable) {
          console.log('server not responding');
        } else {
          console.log('unexpected error');
        }
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
