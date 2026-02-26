import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../js/App';
import { fetchAppConfigFromURL, getAppConfigFromURL } from '../js/Api';

jest.mock('../js/Summary', () => () => null);

jest.mock('../js/Api', () => ({
  ...jest.requireActual('../js/Api'),
  fetchAppConfigFromURL: jest.fn(),
  getAppConfigFromURL: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders loading state', () => {
  getAppConfigFromURL.mockReturnValue({
    league: 'dummy',
    view: 'default',
    title: 'Generic League',
    logo: 'generic',
    useDummyData: true,
    refreshInterval: 300000,
  });
  fetchAppConfigFromURL.mockImplementation(() => new Promise(() => {}));
  render(<App />);
  expect(screen.getByText(/loading data/i)).toBeInTheDocument();
});

test('uses expenses logo asset', async () => {
  const tessensohnConfig = {
    league: 'tessensohn',
    view: 'default',
    title: 'Tessensohn League',
    logo: 'tessensohn',
    useDummyData: false,
    refreshInterval: 300000,
  };

  getAppConfigFromURL.mockReturnValue(tessensohnConfig);
  fetchAppConfigFromURL.mockResolvedValue(tessensohnConfig);

  render(<App />);

  const logoImage = await screen.findByAltText('Tessensohn League logo');
  expect(logoImage).toHaveAttribute('src', expect.stringContaining('expenses.png'));
});
