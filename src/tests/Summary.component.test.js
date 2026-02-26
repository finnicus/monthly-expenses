import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Summary from '../js/Summary';
import { fetchData } from '../js/Api';

jest.mock('../js/Api', () => ({
  fetchData: jest.fn(),
}));

describe('Summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads filtered expenses and updates parent callbacks', async () => {
    const updatedAt = new Date('2099-01-01T00:00:00.000Z');
    const appConfig = { refreshInterval: 300000 };
    const onLoadingChange = jest.fn();

    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date());
    const year = new Date().getFullYear();
    const currentMonthYear = `${month}/${year}`;

    fetchData.mockResolvedValue({
      data: [
        {
          'Month/Year': currentMonthYear,
          Category: 'Internet',
          Amount: '49.90',
        },
        {
          'Month/Year': 'Recurring',
          Category: 'Netflix',
          Amount: '19.99',
        },
        {
          'Month/Year': 'Jan/1999',
          Category: 'Old Expense',
          Amount: '10.00',
        },
      ],
      updatedAt,
      source: 'csv',
    });

    render(
      <Summary
        appConfig={appConfig}
        onLoadingChange={onLoadingChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Category: Internet')).toBeInTheDocument();
    });

    expect(screen.getByText('Category: Netflix')).toBeInTheDocument();
    expect(screen.queryByText('Old Expense')).not.toBeInTheDocument();

    expect(fetchData).toHaveBeenCalledWith(appConfig);
    expect(onLoadingChange).toHaveBeenCalledWith(false);
    expect(screen.getByText('Month/Year')).toBeInTheDocument();
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
    expect(screen.getByText('Total Amount: $69.89')).toBeInTheDocument();
  });

  test('shows empty state when no rows match filter', async () => {
    const appConfig = { refreshInterval: 300000 };
    const onLoadingChange = jest.fn();

    fetchData.mockResolvedValue({
      data: [
        {
          'Month/Year': 'Jan/1999',
          Category: 'Old Expense',
          Amount: '10.00',
        },
      ],
      updatedAt: new Date('2099-01-01T00:00:00.000Z'),
      source: 'csv',
    });

    render(
      <Summary
        appConfig={appConfig}
        onLoadingChange={onLoadingChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No expenses found for/i)).toBeInTheDocument();
    });
  });

  test('sets loading false when data fetch fails', async () => {
    const appConfig = { refreshInterval: 300000 };
    const onLoadingChange = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    fetchData.mockRejectedValue(new Error('fetch failed'));

    render(
      <Summary
        appConfig={appConfig}
        onLoadingChange={onLoadingChange}
      />
    );

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(appConfig);
    });

    expect(onLoadingChange).toHaveBeenCalledWith(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});