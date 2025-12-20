/**
 * Main App Component
 * Orchestrates the PropGPT frontend application
 */

import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import Configuration from './components/Configuration';
import ChatInterface from './components/ChatInterface';
import { getCacheStats } from './api/endpoints';

function App() {
    const { setCacheStats, setError } = useApp();

    // Load cache stats on mount
    useEffect(() => {
        const loadCacheStats = async () => {
            try {
                const response = await getCacheStats();
                setCacheStats(response.data);
            } catch (error) {
                console.error('Failed to load cache stats:', error);
            }
        };

        loadCacheStats();
        // Refresh every minute
        const interval = setInterval(loadCacheStats, 60000);
        return () => clearInterval(interval);
    }, [setCacheStats]);

    return (
        <div className="app-container">
            <Configuration />
            <ChatInterface />
        </div>
    );
}

export default App;
