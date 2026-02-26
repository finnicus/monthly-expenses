import axios from 'axios';

export const REFRESH_INTERVAL = 300000; // 5 minutes in milliseconds
const MASTER_WORKBOOK = '2PACX-1vQU7WJ6o8t6Hb5AqXYHppMn4hg2QLNK7xie1VAdSnC5QuRWnKcwI4SwZGkrTHswxIpBMpuTdgvmi7-E';
const EXPENSES_SHEET = '946802432';
const DEFAULT_VIEW = 'summary';

const buildDataSheetUrl = (gid) => (
  'https://docs.google.com/spreadsheets/d/e/' + MASTER_WORKBOOK + '/pub?gid=' + gid + '&single=true&output=csv'
);

const EXPENSES_SHEET_URL = buildDataSheetUrl(EXPENSES_SHEET);

const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseCSV = (csvText) => {
  const lines = csvText.split('\n').map((line) => line.replace(/\r$/, '')).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((header) => header.trim().replace(/"/g, ''));
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line).map((value) => value.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
};

export const getAppConfigFromURL = (search = '') => {
  const query = new URLSearchParams(search);
  const viewParam = (query.get('view') || DEFAULT_VIEW).trim().toLowerCase();

  return {
    view: viewParam || DEFAULT_VIEW,
    title: 'Monthly Expenses',
    logo: 'generic',
    useDummyData: false,
    expensesSheetUrl: EXPENSES_SHEET_URL,
    refreshInterval: REFRESH_INTERVAL,
  };
};

export const getAppConfigFromUrl = getAppConfigFromURL;

export const fetchAppConfigFromURL = async (search = '') => getAppConfigFromURL(search);

export const fetchData = async (config = {}) => {
  const response = await axios.get(config.expensesSheetUrl || EXPENSES_SHEET_URL);
  const data = parseCSV(response.data);

  return {
    data,
    updatedAt: new Date(),
    source: 'csv',
  };
};

export const fetchSettingsData = async () => ({
  data: null,
  updatedAt: new Date(),
  source: 'expenses-only',
});
