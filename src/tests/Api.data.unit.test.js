import axios from 'axios';
import { fetchData } from '../js/Api';

jest.mock('axios');

describe('fetchData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches CSV from explicit expensesSheetUrl and parses rows', async () => {
    axios.get.mockResolvedValue({
      data: [
        'Month/Year,Category,Amount,Note',
        'Feb/2026,Rent,1200,Home',
        'Recurring,Netflix,19.99,Subscription',
      ].join('\n'),
    });

    const result = await fetchData({
      expensesSheetUrl: 'https://example.com/expenses.csv',
    });

    expect(axios.get).toHaveBeenCalledWith('https://example.com/expenses.csv');
    expect(result.source).toBe('csv');
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.data).toHaveLength(2);

    expect(result.data[0]).toMatchObject({
      'Month/Year': 'Feb/2026',
      Category: 'Rent',
      Amount: '1200',
      Note: 'Home',
    });

    expect(result.data[1]).toMatchObject({
      'Month/Year': 'Recurring',
      Category: 'Netflix',
      Amount: '19.99',
    });
  });

  test('uses default expenses sheet URL when config URL is not provided', async () => {
    axios.get.mockResolvedValue({
      data: [
        'Month/Year,Category,Amount',
        'Feb/2026,Utilities,80',
      ].join('\n'),
    });

    const result = await fetchData({});

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get.mock.calls[0][0]).toContain('output=csv');
    expect(result.data[0]).toMatchObject({
      'Month/Year': 'Feb/2026',
      Category: 'Utilities',
      Amount: '80',
    });
  });
});