import { defaultFormatter } from '../../error/formatter';
// import { CombinedDataTransformer, defaultTransformer } from '../../transformer';
import { AnyRouter, createRouterFactory } from '../router';
import { mergeWithoutOverrides } from './mergeWithoutOverrides';

export function mergeRouters(...routerList: AnyRouter[]): AnyRouter {
  const record = mergeWithoutOverrides(
    {},
    ...routerList.map((r) => r._def.record),
  );
  const errorFormatter = routerList.reduce(
    (currentErrorFormatter, nextRouter) => {
      if (
        nextRouter.errorFormatter &&
        nextRouter.errorFormatter !== defaultFormatter
      ) {
        if (
          currentErrorFormatter !== defaultFormatter &&
          currentErrorFormatter !== nextRouter.errorFormatter
        ) {
          throw new Error('You seem to have several error formatters');
        }
        return nextRouter.errorFormatter;
      }
      return currentErrorFormatter;
    },
    defaultFormatter,
  );

  const contentTypes = routerList
    .map((router) => router._def.contentTypes)
    .flat();
  // const transformer = routerList.reduce((prev, current) => {
  //   if (current.transformer && current.transformer !== defaultTransformer) {
  //     if (prev !== defaultTransformer && prev !== current.transformer) {
  //       throw new Error('You seem to have several transformers');
  //     }
  //     return current.transformer;
  //   }
  //   return prev;
  // }, defaultTransformer as CombinedDataTransformer);

  const router = createRouterFactory({
    errorFormatter,
    contentTypes,
  })(record);
  return router;
}
