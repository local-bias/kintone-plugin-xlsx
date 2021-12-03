import React, { VFC, VFCX } from 'react';
import { useRecoilState } from 'recoil';
import styled from '@emotion/styled';
import produce from 'immer';

import { storageState } from '../states';
import { FormControlLabel, Switch } from '@mui/material';

type Props = {
  storage: kintone.plugin.Storage;
  setAllRecords: (checked: boolean) => void;
  setAllFields: (checked: boolean) => void;
  setUnion: (checked: boolean) => void;
};

const Component: VFCX<Props> = ({ className, storage, setAllRecords, setAllFields, setUnion }) => (
  <div {...{ className }}>
    <div>
      <h3>オプション</h3>
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
);

const StyledComponent = styled(Component)`
  padding: 0 16px;
  > div {
    padding: 8px 8px 8px 16px;
    border-left: 2px solid #0002;
    display: flex;
    flex-direction: column;
    > h3 {
      font-weight: 500;
      margin-bottom: 16px;
    }
  }

  .input {
    min-width: 250px;
  }
`;

const Container: VFC = () => {
  const [storage, setStorage] = useRecoilState(storageState);

  const onSwitchChange = (checked: boolean, option: keyof kintone.plugin.Storage) => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft[option] = checked as never;
      })
    );
  };

  const setAllRecords = (checked: boolean) => onSwitchChange(checked, 'allRecords');
  const setAllFields = (checked: boolean) => onSwitchChange(checked, 'allFields');
  const setUnion = (checked: boolean) => onSwitchChange(checked, 'union');

  return storage && <StyledComponent {...{ storage, setAllRecords, setAllFields, setUnion }} />;
};

export default Container;
