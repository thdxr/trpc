/* eslint-disable @typescript-eslint/no-empty-function */
import { createLegacyAppRouter } from './__testHelpers';
import '@testing-library/jest-dom';
import { setLogger } from 'react-query';
import { createSSGHelpers } from '../../../../react/src/ssg';
import { jsonContentType } from '../../../src/content-type';

setLogger({
  log() {},
  warn() {},
  error() {},
});

let factory: ReturnType<typeof createLegacyAppRouter>;
beforeEach(() => {
  factory = createLegacyAppRouter();
});
afterEach(() => {
  factory.close();
});

test('dehydrate', async () => {
  const { db, appRouter } = factory;
  const ssg = createSSGHelpers({ router: appRouter, ctx: {} });

  await ssg.prefetchQuery('allPosts');
  await ssg.fetchQuery('postById', '1');

  const dehydrated = jsonContentType.fromString(ssg.dehydrate()).queries;
  expect(dehydrated).toHaveLength(2);

  const [cache, cache2] = dehydrated;
  expect(cache!.queryHash).toMatchInlineSnapshot(`"[\\"allPosts\\"]"`);
  expect(cache!.queryKey).toMatchInlineSnapshot(`
    Array [
      "allPosts",
    ]
  `);
  expect(cache!.state.data).toEqual(db.posts);
  expect(cache2!.state.data).toMatchInlineSnapshot(`
    Object {
      "createdAt": 0,
      "id": "1",
      "title": "first post",
    }
  `);
});
