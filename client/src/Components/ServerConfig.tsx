import { useEffect, useMemo, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form';

import { GetServerInfo, UnclaimServer, UpdateServerName } from '../ServerQueries';
import SaveButton from './SaveButton';
import ServerNameInput from './ServerNameInput';
import ServerOwner from './ServerOwner';
import ServerPath from './ServerPath';

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
      try {
        const ret = await GetServerInfo.Post();
        setData(ret);
      } catch {}
    }
    fetchData();
  }, []);

  const onClearOwner = async () => {
    console.log('clear owner');
    const unclaimRes = await UnclaimServer.Post().catch(console.log);
    if (unclaimRes && !unclaimRes.ok) {
      console.log('error');
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

  const onSubmit = async (data: { name: string | undefined | false }) => {
    console.log(data);
    if (data.name) {
      try {
        const updateNameRes = await UpdateServerName.Post({
          name: data.name,
        });
        if (updateNameRes && !updateNameRes.ok) {
          console.log('error');
        }
      } catch {}
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
