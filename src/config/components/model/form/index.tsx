import React, { FCX } from 'react';
import styled from '@emotion/styled';

import { FormControlLabel, Switch } from '@mui/material';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { storageState } from '@/config/states/plugin';

const Component: FCX = ({ className }) => {
  const storage = useRecoilValue(storageState);

  const setAllRecords = useRecoilCallback(
    ({ set }) =>
      (checked: boolean) => {
        set(storageState, (prev) => ({ ...prev, allRecords: checked }));
      },
    []
  );

  const setAllFields = useRecoilCallback(
    ({ set }) =>
      (checked: boolean) => {
        set(storageState, (prev) => ({ ...prev, allFields: checked }));
      },
    []
  );

  const setUnion = useRecoilCallback(
    ({ set }) =>
      (checked: boolean) => {
        set(storageState, (prev) => ({ ...prev, union: checked }));
      },
    []
  );

  return (
    <div {...{ className }}>
      <div>
        <h3>オプション</h3>
        <div className='switches'>
          <FormControlLabel
            control={<Switch color='primary' checked={storage.allRecords} />}
            onChange={(_, checked) => setAllRecords(checked)}
            label='一覧の表示件数に関わらず、検索条件に当てはまる全てのレコードをダウンロードする'
          />
          <FormControlLabel
            control={<Switch color='primary' checked={storage.allFields} />}
            onChange={(_, checked) => setAllFields(checked)}
            label='一覧の表示フィールドに関わらず、全てのフィールドをダウンロードする'
          />

          <FormControlLabel
            control={<Switch color='primary' checked={storage.union} />}
            onChange={(_, checked) => setUnion(checked)}
            label='サブテーブルでないフィールドの行を結合する'
          />
        </div>
      </div>
    </div>
  );
};

const StyledComponent = styled(Component)`
  padding: 0 16px;
  > div {
    padding: 8px 8px 8px 16px;
    > h3 {
      font-weight: 500;
      margin-bottom: 16px;
    }
  }
  .switches {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
`;

export default StyledComponent;
