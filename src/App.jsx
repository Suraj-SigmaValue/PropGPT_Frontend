/**
 * Main App Component
 * Orchestrates the PropGPT frontend application
 * Updated with Tailwind CSS
 */

import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import Configuration from './components/Configuration';
import ChatInterface from './components/ChatInterface';
import { getCacheStats } from './api/endpoints';

function App() {
    const { setCacheStats } = useApp();

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
        <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
            <Configuration />
            <div className="flex-1 flex flex-col h-full relative min-w-0">
                <ChatInterface />
            </div>
        </div>
    );
}

export default App;
