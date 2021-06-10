import { ProcedureType } from '@trpc/server';
import { TRPCClientError } from '../createTRPCClient';
import { LinkRuntimeOptions, PromiseAndCancel } from '../links/core';

export function httpRequest<TResponseShape>(props: {
  runtime: LinkRuntimeOptions;
  type: ProcedureType;
  input: unknown;
  path: string;
  url: string;
  searchParams?: string;
}): PromiseAndCancel<any> {
  const { type, runtime: rt, input, path } = props;
  const ac = rt.AbortController ? new rt.AbortController() : null;
  const method = {
    query: 'GET',
    mutation: 'POST',
    subscription: 'PATCH',
  };
  function getUrl() {
    let url = props.url + '/' + path;
    const queryParts: string[] = [];
    if (props.searchParams) {
      queryParts.push(props.searchParams);
    }
    if (type === 'query' && input != null) {
      queryParts.push(
        `input=${encodeURIComponent(
          JSON.stringify(rt.transformer.serialize(input)),
        )}`,
      );
    }
    if (queryParts.length) {
      url += '?' + queryParts.join('&');
    }
    return url;
  }
  function getBody() {
    if (type === 'query') {
      return undefined;
    }
    return JSON.stringify({
      input: rt.transformer.serialize(input),
    });
  }

  const promise = new Promise<TResponseShape>((resolve, reject) => {
    const url = getUrl();

    rt.fetch(url, {
      method: method[type],
      signal: ac?.signal,
      body: getBody(),
      headers: {
        'content-type': 'application/json',
        ...rt.headers(),
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        resolve(rt.transformer.deserialize(json));
      })
      .catch((originalError) => {
        const err = new TRPCClientError(originalError?.message, {
          originalError,
        });
        reject(err);
      });
  });
  const cancel = () => {
    ac?.abort();
  };
  return { promise, cancel };
}