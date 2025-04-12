import { GUEST_SPACE_ID } from '@/common/global';
import { getApp, getAppId, getFormFields, getViews } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

export const currentAppIdAtom = atom(() => {
  const appId = getAppId();
  if (!appId) {
    throw new Error('App ID not found');
  }
  return appId;
});

export const kintoneAppPropertyAtom = atomFamily((appId: string | number) =>
  atom(async () => {
    return getApp({
      id: appId,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });
  })
);

export const currentAppPropertyAtom = atom((get) => {
  const appId = get(currentAppIdAtom);
  return get(kintoneAppPropertyAtom(appId));
});

export const kintoneAppViewsAtom = atomFamily((appId: string | number) =>
  atom(async () => {
    return getViews({
      app: appId,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });
  })
);

export const currentAppViewsAtom = atom((get) => {
  const appId = get(currentAppIdAtom);
  return get(kintoneAppViewsAtom(appId));
});

export const kintoneAppFormFieldsAtom = atomFamily((appId: string | number) =>
  atom(async () => {
    return getFormFields({
      app: appId,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });
  })
);

export const currentAppFormFieldsAtom = atom((get) => {
  const appId = get(currentAppIdAtom);
  return get(kintoneAppFormFieldsAtom(appId));
});
