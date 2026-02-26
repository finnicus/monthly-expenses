import {
  fetchAppConfigFromURL,
  getAppConfigFromURL,
  getAppConfigFromUrl,
} from '../js/Api';

describe('app config helpers', () => {
  test('getAppConfigFromURL returns expenses defaults when query is empty', () => {
    const config = getAppConfigFromURL('');

    expect(config.view).toBe('summary');
    expect(config.title).toBe('Monthly Expenses');
    expect(config.logo).toBe('generic');
    expect(config.useDummyData).toBe(false);
    expect(config.expensesSheetUrl).toContain('output=csv');
    expect(config.refreshInterval).toBe(300000);
  });

  test('getAppConfigFromURL normalizes view query and alias returns same output', () => {
    const config = getAppConfigFromURL('?view=  compact  ');
    const aliasConfig = getAppConfigFromUrl('?view=  compact  ');

    expect(config.view).toBe('compact');
    expect(config.title).toBe('Monthly Expenses');
    expect(config.logo).toBe('generic');
    expect(config.useDummyData).toBe(false);
    expect(aliasConfig).toEqual(config);
  });

  test('fetchAppConfigFromURL returns expenses config from URL helper', async () => {
    const config = await fetchAppConfigFromURL('?view=summary');

    expect(config.view).toBe('summary');
    expect(config.useDummyData).toBe(false);
    expect(config.title).toBe('Monthly Expenses');
    expect(config.expensesSheetUrl).toContain('output=csv');
  });
});