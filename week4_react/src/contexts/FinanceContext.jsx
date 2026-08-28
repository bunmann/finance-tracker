import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import api from '../api';

const FinanceContext = createContext(null);

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
};

export const FinanceProvider = ({ children }) => {
    // Global Synced Date Period State (Shared across Wealth, Cash Flow, Transactions, Budgets)
    const [globalPeriod, setGlobalPeriodState] = useState({
        mode: 'all', // 'all' | 'year' | 'month'
        month: 0,
        year: 0
    });

    const setGlobalPeriod = useCallback((newPeriod) => {
        setGlobalPeriodState(prev => ({
            ...prev,
            ...newPeriod
        }));
    }, []);

    // Wealth State
    const [wealthData, setWealthData] = useState(null);
    const [healthData, setHealthData] = useState(null);
    const [isWealthLoading, setIsWealthLoading] = useState(false);
    const [wealthError, setWealthError] = useState(null);

    // Stocks State
    const [portfolioData, setPortfolioData] = useState(null);
    const [watchlistData, setWatchlistData] = useState(null);
    const [competenceData, setCompetenceData] = useState(null);
    const [screenerData, setScreenerData] = useState(null);
    const [isStocksLoading, setIsStocksLoading] = useState(false);
    const [stocksError, setStocksError] = useState(null);

    // Transactions/Cashflow State
    const [transactionsData, setTransactionsData] = useState(null);
    const [categoriesData, setCategoriesData] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);
    const [transactionsError, setTransactionsError] = useState(null);

    // Stable Cache Tracking Refs (Prevents useCallback dependency invalidation loops)
    const wealthDataRef = useRef({ wealthData: null, healthData: null });
    const stocksDataRef = useRef({ portfolioData: null, watchlistData: null, competenceData: null, screenerData: null });
    const transactionsDataRef = useRef({ transactionsData: null, categoriesData: null });

    const isFetchingWealthRef = useRef(false);
    const isFetchingStocksRef = useRef(false);
    const isFetchingTransactionsRef = useRef(false);

    useEffect(() => {
        wealthDataRef.current = { wealthData, healthData };
    }, [wealthData, healthData]);

    useEffect(() => {
        stocksDataRef.current = { portfolioData, watchlistData, competenceData, screenerData };
    }, [portfolioData, watchlistData, competenceData, screenerData]);

    useEffect(() => {
        transactionsDataRef.current = { transactionsData, categoriesData };
    }, [transactionsData, categoriesData]);

    const lastWealthPeriodRef = useRef({ month: -1, year: -1 });

    // Fetch Wealth Data (STABLE REFS, PROMISE.ALLSETTLED, INSTANT HEALTH FETCH)
    const fetchWealthData = useCallback(async (month = 0, year = 0, force = false) => {
        const { wealthData: currentNw, healthData: currentH } = wealthDataRef.current;
        const periodChanged = lastWealthPeriodRef.current.month !== month || lastWealthPeriodRef.current.year !== year;

        if (!force && !periodChanged && currentNw && currentH) return;
        if (isFetchingWealthRef.current) return;

        isFetchingWealthRef.current = true;
        lastWealthPeriodRef.current = { month, year };
        setIsWealthLoading(true);

        try {
            // Fast 15ms database health query
            const hPromise = api.get(`/wealth/health?month=${month}&year=${year}`)
                .then(res => {
                    setHealthData(res.data);
                })
                .catch(err => console.error("Health fetch error:", err));

            // Only query net-worth (which calls external stock APIs) if missing or forced
            const nwPromise = (!currentNw || force)
                ? api.get('/wealth/net-worth')
                    .then(res => {
                        setWealthData(res.data);
                    })
                    .catch(err => console.error("Net worth fetch error:", err))
                : Promise.resolve();

            await Promise.allSettled([hPromise, nwPromise]);
            setWealthError(null);
        } catch (err) {
            console.error("Error fetching wealth data:", err);
            setWealthError("Failed to load wealth data.");
        } finally {
            setIsWealthLoading(false);
            isFetchingWealthRef.current = false;
        }
    }, []);

    // Fetch Stocks Data (STABLE REFS, PROMISE.ALLSETTLED)
    const fetchStocksData = useCallback(async (force = false) => {
        const { portfolioData: p, watchlistData: w, competenceData: c, screenerData: s } = stocksDataRef.current;
        if (!force && p && w && c && s) return;
        if (isFetchingStocksRef.current) return;

        isFetchingStocksRef.current = true;
        setIsStocksLoading(true);

        try {
            const results = await Promise.allSettled([
                api.get('/stocks/portfolio'),
                api.get('/stocks/watchlist'),
                api.get('/stocks/competence'),
                api.get('/screener/candidates')
            ]);

            const [pRes, wRes, cRes, sRes] = results;

            if (pRes.status === 'fulfilled') setPortfolioData(pRes.value.data);
            if (wRes.status === 'fulfilled') setWatchlistData(Array.isArray(wRes.value.data) ? wRes.value.data : []);
            if (cRes.status === 'fulfilled') setCompetenceData(Array.isArray(cRes.value.data) ? cRes.value.data : []);
            if (sRes.status === 'fulfilled') setScreenerData(Array.isArray(sRes.value.data?.candidates) ? sRes.value.data.candidates : []);

            if (pRes.status === 'fulfilled') {
                setStocksError(null);
            } else {
                setStocksError("Failed to load stock portfolio.");
            }
        } catch (err) {
            console.error("Error fetching stocks data:", err);
            setStocksError("Failed to load stock data.");
        } finally {
            setIsStocksLoading(false);
            isFetchingStocksRef.current = false;
        }
    }, []);

    // Fetch Transactions Data (STABLE REFS, PROMISE.ALLSETTLED)
    const fetchTransactionsData = useCallback(async (force = false) => {
        const { transactionsData: tx, categoriesData: cat } = transactionsDataRef.current;
        if (!force && tx && cat) return;
        if (isFetchingTransactionsRef.current) return;

        isFetchingTransactionsRef.current = true;
        setIsTransactionsLoading(true);

        try {
            const results = await Promise.allSettled([
                api.get('/transactions?limit=5000'),
                api.get('/categories')
            ]);

            const [txRes, catRes] = results;

            if (txRes.status === 'fulfilled') setTransactionsData(txRes.value.data);
            if (catRes.status === 'fulfilled') setCategoriesData(catRes.value.data);

            if (txRes.status === 'fulfilled' || catRes.status === 'fulfilled') {
                setTransactionsError(null);
            } else {
                setTransactionsError("Failed to load transactions.");
            }
        } catch (err) {
            console.error("Error fetching transaction data:", err);
            setTransactionsError("Failed to load transactions.");
        } finally {
            setIsTransactionsLoading(false);
            isFetchingTransactionsRef.current = false;
        }
    }, []);

    return (
        <FinanceContext.Provider value={{
            // Global Period Filter
            globalPeriod,
            setGlobalPeriod,

            // Wealth
            wealthData,
            healthData,
            isWealthLoading,
            wealthError,
            fetchWealthData,

            // Stocks
            portfolioData,
            watchlistData,
            competenceData,
            screenerData,
            isStocksLoading,
            stocksError,
            fetchStocksData,

            // Transactions
            transactionsData,
            categoriesData,
            dashboardData,
            setDashboardData,
            isTransactionsLoading,
            transactionsError,
            fetchTransactionsData,

            // Setters for optimistic UI updates
            setWealthData,
            setHealthData,
            setPortfolioData,
            setWatchlistData,
            setCompetenceData,
            setScreenerData,
            setTransactionsData,
            setCategoriesData
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
