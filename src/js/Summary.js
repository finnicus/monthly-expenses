import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { fetchData } from './Api';

const normalizeToken = (value) => String(value || '').trim().replace(/\s+/g, '').toUpperCase();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_TO_INDEX = MONTHS.reduce((acc, month, index) => ({ ...acc, [month.toUpperCase()]: index }), {});
const MONTH_ICONS = {
  Jan: '❄️',
  Feb: '💘',
  Mar: '🌱',
  Apr: '🌷',
  May: '🌿',
  Jun: '🌞',
  Jul: '🏖️',
  Aug: '🌻',
  Sep: '🍂',
  Oct: '🎃',
  Nov: '🦃',
  Dec: '🎄',
};

const getCurrentMonthYear = () => {
  const now = new Date();
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(now);
  const year = now.getFullYear();
  return `${month}/${year}`;
};

const monthYearToIndex = (monthYear) => {
  const match = String(monthYear || '').trim().match(/^([A-Za-z]{3})\s*\/\s*(\d{4})$/);
  if (!match) {
    return null;
  }

  const monthIndex = MONTH_TO_INDEX[match[1].toUpperCase()];
  if (monthIndex === undefined) {
    return null;
  }

  const year = Number.parseInt(match[2], 10);
  if (Number.isNaN(year)) {
    return null;
  }

  return (year * 12) + monthIndex;
};

const normalizeMonthYearLabel = (monthYear) => {
  const match = String(monthYear || '').trim().match(/^([A-Za-z]{3})\s*\/\s*(\d{4})$/);
  if (!match) {
    return '';
  }

  const monthIndex = MONTH_TO_INDEX[match[1].toUpperCase()];
  if (monthIndex === undefined) {
    return '';
  }

  return `${MONTHS[monthIndex]}/${match[2]}`;
};

const indexToMonthYear = (index) => {
  const monthIndex = ((index % 12) + 12) % 12;
  const year = Math.floor(index / 12);
  return `${MONTHS[monthIndex]}/${year}`;
};

const getMonthIcon = (monthYear) => {
  const month = String(monthYear || '').split('/')[0];
  return MONTH_ICONS[month] || '📅';
};

const getMonthYearValue = (row) => (
  row['Month/Year']
  || row['Month / Year']
  || row['month/year']
  || row['month / year']
  || row.MonthYear
  || row.monthYear
  || ''
);

const getCategoryValue = (row) => {
  const categoryKey = Object.keys(row || {}).find((key) => key.trim().toLowerCase() === 'category');
  return categoryKey ? String(row[categoryKey] || '').trim() : '';
};

const getAmountValue = (row) => {
  const amountKey = Object.keys(row || {}).find((key) => key.trim().toLowerCase() === 'amount');
  return amountKey ? row[amountKey] : '';
};

const parseAmount = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const text = String(value || '').trim();
  if (!text) {
    return 0;
  }

  const isNegativeParentheses = /^\(.*\)$/.test(text);
  const normalized = text.replace(/[,$()\s]/g, '').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return isNegativeParentheses ? -Math.abs(parsed) : parsed;
};

function Summary({ appConfig, onLoadingChange }) {
  const [data, setData] = useState([]);
  const [activeMonthYear, setActiveMonthYear] = useState(getCurrentMonthYear());
  const currentMonthYear = getCurrentMonthYear();

  const loadExpensesData = useCallback(async () => {
    try {
      const { data: expensesData, updatedAt, source } = await fetchData(appConfig);
      setData(expensesData);
      const logMessage = source === 'dummy'
        ? `Dummy expenses data loaded at: ${updatedAt.toLocaleString()}`
        : `Expenses data updated from CSV at: ${updatedAt.toLocaleString()}`;
      console.log(logMessage);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      onLoadingChange(false);
    }
  }, [appConfig, onLoadingChange]);

  useEffect(() => {
    loadExpensesData();

    const intervalId = setInterval(loadExpensesData, appConfig.refreshInterval);
    return () => clearInterval(intervalId);
  }, [appConfig.refreshInterval, loadExpensesData]);

  const monthOptions = useMemo(() => {
    const currentIndex = monthYearToIndex(currentMonthYear);
    if (currentIndex === null) {
      return [currentMonthYear];
    }

    const currentMonthOfYear = ((currentIndex % 12) + 12) % 12;
    const startIndex = currentMonthOfYear === 0
      ? currentIndex - 3
      : (currentMonthOfYear === 1
        ? currentIndex - 2
        : (Math.floor(currentIndex / 12) * 12));
    const endIndex = currentIndex + 2;

    const options = [];
    for (let index = startIndex; index <= endIndex; index += 1) {
      options.push(indexToMonthYear(index));
    }

    return options;
  }, [currentMonthYear]);

  useEffect(() => {
    if (monthOptions.length === 0) {
      return;
    }

    if (!monthOptions.includes(activeMonthYear)) {
      setActiveMonthYear(monthOptions.includes(currentMonthYear) ? currentMonthYear : monthOptions[monthOptions.length - 1]);
    }
  }, [activeMonthYear, currentMonthYear, monthOptions]);

  const filteredData = useMemo(() => {
    const selectedMonthToken = normalizeToken(activeMonthYear);
    return data.filter((row) => {
      const monthYearValue = normalizeToken(getMonthYearValue(row));
      return monthYearValue === selectedMonthToken || monthYearValue === 'RECURRING';
    });
  }, [activeMonthYear, data]);

  const columns = useMemo(() => {
    const keys = Array.from(filteredData.reduce((acc, row) => {
      Object.keys(row || {}).forEach((key) => acc.add(key));
      return acc;
    }, new Set())).filter((key) => key.trim().toLowerCase() !== 'category');

    return keys.map((key) => ({
      id: key,
      accessorFn: (row) => row[key],
      header: key,
      cell: (info) => String(info.getValue() ?? ''),
    }));
  }, [filteredData]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const visibleRows = table.getRowModel().rows;

  const totalAmount = useMemo(
    () => filteredData.reduce((sum, row) => sum + parseAmount(getAmountValue(row)), 0),
    [filteredData],
  );

  const formattedTotalAmount = useMemo(
    () => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalAmount),
    [totalAmount],
  );

  return (
    <>
      <div className="table-container">
        <div className="month-controls">
          <label htmlFor="month-year-select" className="month-controls-label">View month</label>
          <select
            id="month-year-select"
            className="month-controls-select"
            value={activeMonthYear}
            onChange={(event) => setActiveMonthYear(event.target.value)}
          >
            {monthOptions.map((option) => (
              <option key={option} value={option}>{`${getMonthIcon(option)} ${option}${option === currentMonthYear ? ' • Current' : ''}`}</option>
            ))}
          </select>
        </div>
        {filteredData.length === 0 ? (
          <p>{`No expenses found for ${activeMonthYear}.`}</p>
        ) : (
          <>
            <table className="data-table">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : header.column.columnDef.header}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {visibleRows.map((row, index) => {
                  const currentCategoryLabel = getCategoryValue(row.original);
                  const currentCategory = currentCategoryLabel.toLowerCase();
                  const previousCategory = index > 0
                    ? getCategoryValue(visibleRows[index - 1].original).toLowerCase()
                    : '';
                  const shouldInsertGap = index > 0 && currentCategory && previousCategory && currentCategory !== previousCategory;
                  const shouldInsertCategoryLabel = currentCategory && (index === 0 || currentCategory !== previousCategory);

                  return (
                    <React.Fragment key={row.id}>
                      {shouldInsertGap ? (
                        <tr className="category-gap-row" aria-hidden="true">
                          <td colSpan={row.getVisibleCells().length} />
                        </tr>
                      ) : null}
                      {shouldInsertCategoryLabel ? (
                        <tr className="category-label-row">
                          <td colSpan={row.getVisibleCells().length}>
                            <span className="category-label-text">{`Category: ${currentCategoryLabel}`}</span>
                          </td>
                        </tr>
                      ) : null}
                      <tr>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>
                            {cell.column.columnDef.cell(cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            <div className="total-card-wrap">
              <div className="table-total-card">{`Total Amount: $${formattedTotalAmount}`}</div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Summary;