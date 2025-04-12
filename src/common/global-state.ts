import { atom } from 'jotai';

export const loadingAtom = atom<boolean>(false);

const loadingCountAtom = atom<number>(0);

export const loadingStartAtom = atom(null, (_, set) => set(loadingCountAtom, (c) => c + 1));

export const loadingEndAtom = atom(null, (_, set) => set(loadingCountAtom, (c) => c - 1));
