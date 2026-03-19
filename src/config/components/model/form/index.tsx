import { pluginConfigAtom } from '@/config/states/plugin';
import styled from '@emotion/styled';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { FormControlLabel, Switch, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC } from 'react';

const handleAllRecordsChangeAtom = atom(null, (_, set, checked: boolean) => {
  set(pluginConfigAtom, (prev) => ({ ...prev, allRecords: checked }));
});

const handleAllFieldsChangeAtom = atom(null, (_, set, checked: boolean) => {
  set(pluginConfigAtom, (prev) => ({ ...prev, allFields: checked }));
});

const handleUnionChangeAtom = atom(null, (_, set, checked: boolean) => {
  set(pluginConfigAtom, (prev) => ({ ...prev, union: checked }));
});

const handleDateAsExcelChangeAtom = atom(null, (_, set, checked: boolean) => {
  set(pluginConfigAtom, (prev) => ({ ...prev, dateAsExcel: checked }));
});

const handleFileNameTemplateChangeAtom = atom(null, (_, set, value: string) => {
  set(pluginConfigAtom, (prev) => ({ ...prev, fileNameTemplate: value }));
});

const handleSheetNameChangeAtom = atom(null, (_, set, value: string) => {
  set(pluginConfigAtom, (prev) => ({ ...prev, sheetName: value }));
});

const Component: FC<{ className?: string }> = ({ className }) => {
  const storage = useAtomValue(pluginConfigAtom);
  const setAllRecords = useSetAtom(handleAllRecordsChangeAtom);
  const setAllFields = useSetAtom(handleAllFieldsChangeAtom);
  const setUnion = useSetAtom(handleUnionChangeAtom);
  const setDateAsExcel = useSetAtom(handleDateAsExcelChangeAtom);
  const setFileNameTemplate = useSetAtom(handleFileNameTemplateChangeAtom);
  const setSheetName = useSetAtom(handleSheetNameChangeAtom);

  return (
    <div {...{ className }}>
      <PluginFormSection>
        <PluginFormTitle>出力オプション</PluginFormTitle>
        <PluginFormDescription last></PluginFormDescription>

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
          <FormControlLabel
            control={<Switch color='primary' checked={storage.dateAsExcel} />}
            onChange={(_, checked) => setDateAsExcel(checked)}
            label='日付・日時・時刻フィールドをExcel日付形式で出力する (日付の並び替えや計算が可能になります)'
          />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>ファイル名・シート名設定</PluginFormTitle>
        <PluginFormDescription last>
          テンプレートで使用できる変数は以下の通りです。
          <ul>
            <li>
              <code>{'{appName}'}</code> - アプリ名
            </li>
            <li>
              <code>{'{date}'}</code> - 日付 (YYYY-MM-DD)
            </li>
            <li>
              <code>{'{time}'}</code> - 時刻 (HH-mm)
            </li>
            <li>
              <code>{'{appId}'}</code> - アプリID
            </li>
          </ul>
        </PluginFormDescription>
        <div className='file-name-section'>
          <TextField
            label='ファイル名テンプレート'
            value={storage.fileNameTemplate}
            onChange={(e) => setFileNameTemplate(e.target.value)}
            helperText='例: {appName}_{date}'
            fullWidth
          />
          <TextField
            label='シート名テンプレート'
            value={storage.sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            helperText='最大31文字。\ / : * ? [ ] は自動的に _ に置換されます。例: {appName}'
            fullWidth
          />
        </div>
      </PluginFormSection>
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
  .file-name-section {
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`;

export default StyledComponent;
