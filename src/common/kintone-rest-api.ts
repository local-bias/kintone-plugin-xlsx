import { getAppId } from './kintone';
import { Record as KintoneRecord } from '@kintone/rest-api-client/lib/client/types';

type Listener = ((key?: any) => any) | null;

type GetProps<T> = Readonly<
  Partial<{
    app: number | string;
    fields: (keyof T)[];
    totalCount: boolean;
    query: string;
    onGetTotal: (total: number) => void;
    onAdvance: (records: T[]) => void;
  }>
>;

type GetMethod = <T = KintoneRecord, U extends keyof T = keyof T>(
  props?: GetProps<T>
) => Promise<{ [P in U]: T[P] }[]>;

interface CursorProps<T> {
  id: string;
  onAdvance: Listener;
  loadedData?: T[];
}

const END_POINT = '/k/v1/';

// 各リクエストのレコード上限
const LIMIT_GET = 500;

export const getAllRecords: GetMethod = async (props = {}) => {
  const {
    app = getAppId(),
    fields = [],
    totalCount = false,
    query = '',
    onGetTotal = null,
    onAdvance = null,
  } = props;

  const param = { app, fields, size: LIMIT_GET, totalCount, query: '' };

  if (query && (~query.indexOf('limit') || ~query.indexOf('offset'))) {
    param.query = query;

    const { records } = await kintone.api(
      kintone.api.url(`${END_POINT}records`, true),
      'GET',
      param
    );

    return records;
  }

  param.query = query ? formatQuery(query) : '';

  const cursor = await kintone.api(
    kintone.api.url(`${END_POINT}records/cursor`, true),
    'POST',
    param
  );

  if (onGetTotal) {
    onGetTotal(cursor.totalCount);
  }

  return getRecordsByCursorId({ id: cursor.id, onAdvance });
};

const getRecordsByCursorId = async <T>({
  id,
  onAdvance,
  loadedData = [],
}: CursorProps<T>): Promise<T[]> => {
  const response = await kintone.api(kintone.api.url(`${END_POINT}records/cursor`, true), 'GET', {
    id,
  });

  const newRecords: T[] = [...loadedData, ...response.records];

  if (onAdvance) {
    onAdvance(newRecords);
  }

  return response.next
    ? getRecordsByCursorId({ id, onAdvance, loadedData: newRecords })
    : newRecords;
};

const formatQuery = (query: string): string => {
  return query.replace(/limit.*/g, '').replace(/offset.*/g, '');
};
