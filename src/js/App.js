import React, { useState, useMemo, useEffect } from 'react';
import { fetchAppConfigFromURL, getAppConfigFromURL } from './Api';
import Summary from './Summary';
import expensesLogo from '../logo/expenses.png';
import '../css/App.css';

const setDocumentIcon = (href, rel) => {
  let iconTag = document.querySelector(`link[rel="${rel}"]`);
  if (!iconTag) {
    iconTag = document.createElement('link');
    iconTag.setAttribute('rel', rel);
    document.head.appendChild(iconTag);
  }
  iconTag.setAttribute('href', href);
};

function App() {
  const initialConfig = useMemo(() => getAppConfigFromURL(window.location.search), []);
  const [appConfig, setAppConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrateConfig = async () => {
      try {
        const resolvedConfig = await fetchAppConfigFromURL(window.location.search);
        if (!cancelled) {
          setAppConfig(resolvedConfig);
        }
      } catch (error) {
        console.error('Error loading app config:', error);
      }
    };

    hydrateConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title = appConfig.title;
    setDocumentIcon(expensesLogo, 'icon');
    setDocumentIcon(expensesLogo, 'apple-touch-icon');
  }, [appConfig.title]);

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <div className="logo-section">
            <img src={expensesLogo} alt={`${appConfig.title} logo`} className="site-logo" />
            <div className="title-section">
              <h1>{appConfig.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {loading && <div className="loading-screen"><div className="spinner" /> Loading data...</div>}
        <Summary
          appConfig={appConfig}
          onLoadingChange={setLoading}
        />
      </main>
    </div>
  );
}

export default App;
