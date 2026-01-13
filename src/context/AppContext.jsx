/**
 * AppContext - Global State Management
 * Manages chat state, configuration, and API interactions
 */

import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // Chat state
    const [messages, setMessages] = useState([]);

    // Configuration state
    const [comparisonType, setComparisonType] = useState('Location');
    const [selectedCity, setSelectedCity] = useState('Pune'); // City selection
    const [availableCities, setAvailableCities] = useState(['Pune']); // Can add more cities here
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState(['All']);
    const [selectedYears, setSelectedYears] = useState([2020, 2021, 2022, 2023, 2024]);
    const [mappingLLMProvider, setMappingLLMProvider] = useState('OpenAI');
    const [responseLLMProvider, setResponseLLMProvider] = useState('OpenAI');

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cache state
    const [cacheStats, setCacheStats] = useState(null);

    // Available items
    const [availableItems, setAvailableItems] = useState([]);

    // Add message to chat
    const addMessage = (role, content, metadata = {}) => {
        setMessages(prev => [...prev, { role, content, metadata, timestamp: new Date() }]);
    };

    // Clear chat
    const clearChat = () => {
        setMessages([]);
    };

    const value = {
        // Chat
        messages,
        addMessage,
        clearChat,

        // Configuration
        comparisonType,
        setComparisonType,
        selectedCity,
        setSelectedCity,
        availableCities,
        setAvailableCities,
        selectedItems,
        setSelectedItems,
        selectedCategories,
        setSelectedCategories,
        selectedYears,
        setSelectedYears,
        mappingLLMProvider,
        setMappingLLMProvider,
        responseLLMProvider,
        setResponseLLMProvider,

        // UI
        loading,
        setLoading,
        error,
        setError,

        // Cache
        cacheStats,
        setCacheStats,

        // Items
        availableItems,
        setAvailableItems,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export default AppContext;
