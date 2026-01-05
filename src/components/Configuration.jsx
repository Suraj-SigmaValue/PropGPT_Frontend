/**
 * Configuration Sidebar Component
 * Replicates the Streamlit sidebar functionality
 * Updated with Tailwind CSS
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getComparisonItems, getCacheStats, clearCache, getCategories } from '../api/endpoints';

const Configuration = () => {
    const {
        comparisonType,
        setComparisonType,
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
        cacheStats,
        setCacheStats,
        availableItems,
        setAvailableItems,
        clearChat,
        messages,
    } = useApp();

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);

    // Load items when comparison type changes
    useEffect(() => {
        setSelectedItems([]); // Clear selection when type changes
        setSearchTerm(''); // Clear search when type changes
        const loadItems = async () => {
            setLoading(true);
            try {
                const response = await getComparisonItems(comparisonType);
                setAvailableItems(response.data.items || []);
            } catch (error) {
                console.error('Failed to load items:', error);
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, [comparisonType, setAvailableItems, setSelectedItems]);

    // Load categories based on comparison type
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await getCategories(comparisonType);
                const fetchedCategories = response.data.categories || [];

                // Capitalize first letter of each category for display
                const formattedCategories = fetchedCategories.map(cat =>
                    cat.charAt(0).toUpperCase() + cat.slice(1)
                );

                setCategories(formattedCategories);
            } catch (error) {
                console.error('Failed to load categories:', error);
                // Fallback to default categories if API fails
                setCategories(['All', 'Supply', 'Demand', 'Price', 'Demographics']);
            }
        };
        loadCategories();
    }, [comparisonType]); // Reload categories when comparison type changes

    const handleClearCache = async () => {
        try {
            await clearCache();
            const response = await getCacheStats();
            setCacheStats(response.data);
            alert('Cache cleared successfully!');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    };

    return (
        <div className="w-80 h-full flex flex-col border-r border-slate-700 bg-slate-900/40 backdrop-blur-xl overflow-y-auto shrink-0 custom-scrollbar">
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white tracking-tight">Configuration</h2>
                <p className="text-sm text-slate-400 mt-1">Set analysis parameters</p>
            </div>

            {/* Comparison Type */}
            <div className="p-6 border-b border-slate-800/50">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Comparison Type</label>
                <select
                    value={comparisonType}
                    onChange={(e) => {
                        setComparisonType(e.target.value);
                        setSelectedItems([]);
                        setSearchTerm('');
                        clearChat();
                    }}
                    className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm py-2 px-3 text-slate-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                    <option value="Location">Location</option>
                    <option value="City">City</option>
                    <option value="Project">Project</option>
                </select>
            </div>

            {/* LLM Providers */}
            <div className="p-6 border-b border-slate-800/50 space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mapping LLM Provider</label>
                    <select
                        value={mappingLLMProvider}
                        onChange={(e) => setMappingLLMProvider(e.target.value)}
                        className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm py-2 px-3 text-slate-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="OpenAI">OpenAI</option>
                        <option value="Google Gemini">Google Gemini</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Response LLM Provider</label>
                    <select
                        value={responseLLMProvider}
                        onChange={(e) => setResponseLLMProvider(e.target.value)}
                        className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm py-2 px-3 text-slate-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="OpenAI">OpenAI</option>
                        <option value="Google Gemini">Google Gemini</option>
                    </select>
                </div>
            </div>

            {/* Items Selection */}
            <div className="p-6 border-b border-slate-800/50">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Select {comparisonType}s</label>

                {/* Selected Items Chips */}
                {selectedItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedItems.map(item => (
                            <div key={item} className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                                <span>{item}</span>
                                <button
                                    onClick={() => setSelectedItems(selectedItems.filter(i => i !== item))}
                                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-blue-400 hover:bg-blue-500/20 focus:outline-none hover:text-white transition-colors"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mb-3 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={`Search ${comparisonType}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm py-2 pl-10 pr-3 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                    />
                </div>
                {loading ? (
                    <div className="text-sm text-slate-500 text-center py-4">Loading items...</div>
                ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar border border-slate-700/50 rounded-lg p-2 bg-slate-800/30">
                        {availableItems
                            .filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(item => (
                                <div key={item} className="flex items-center px-1 py-1 hover:bg-slate-700/50 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        id={`item-${item}`}
                                        checked={selectedItems.includes(item)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                if (selectedItems.length < 5) {
                                                    setSelectedItems([...selectedItems, item]);
                                                } else {
                                                    alert('Maximum 5 items can be selected');
                                                }
                                            } else {
                                                setSelectedItems(selectedItems.filter(i => i !== item));
                                            }
                                        }}
                                        disabled={!selectedItems.includes(item) && selectedItems.length >= 5}
                                        className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    />
                                    <label htmlFor={`item-${item}`} className="ml-2 block text-sm text-slate-300 truncate cursor-pointer select-none grow">
                                        {item}
                                    </label>
                                </div>
                            ))}
                        {availableItems.filter(item => item.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                            <div className="text-xs text-slate-500 text-center py-2">No matches found</div>
                        )}
                    </div>
                )}
                <div className="mt-2 text-right">
                    <span className="text-xs text-slate-500">{selectedItems.length} / 5 selected</span>
                </div>
            </div>

            {/* Categories */}
            <div className="p-6 border-b border-slate-800/50">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Analysis Categories</label>
                <div className="space-y-2">
                    {categories.map(cat => (
                        <div key={cat} className="flex items-center">
                            <input
                                type="checkbox"
                                id={cat}
                                checked={selectedCategories.includes(cat)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedCategories([...selectedCategories, cat]);
                                    } else {
                                        setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                    }
                                }}
                                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                            />
                            <label htmlFor={cat} className="ml-2 text-sm text-slate-300 cursor-pointer select-none">
                                {cat}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Year Filter */}
            {comparisonType.toLowerCase() !== 'project' && (
                <div className="p-6 border-b border-slate-800/50">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Select Years</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[2020, 2021, 2022, 2023, 2024].map(year => (
                            <div key={year} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`year-${year}`}
                                    checked={selectedYears.includes(year)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedYears([...selectedYears, year]);
                                        } else {
                                            setSelectedYears(selectedYears.filter(y => y !== year));
                                        }
                                    }}
                                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                />
                                <label htmlFor={`year-${year}`} className="ml-2 text-sm text-slate-300 cursor-pointer select-none">
                                    {year}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis Details Box */}
            {messages.length > 0 && (() => {
                const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
                if (!lastAssistantMessage?.metadata) return null;

                const { mappingKeys, selectedColumns } = lastAssistantMessage.metadata;

                return (
                    <div className="p-6 border-b border-slate-800/50">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Analysis Details</label>

                        {mappingKeys && mappingKeys.length > 0 && (
                            <div className="bg-slate-950/50 border border-indigo-500/30 rounded-md p-3 mb-3">
                                <small className="block mb-1 text-slate-500 font-semibold text-xs">Mapping Keys</small>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {mappingKeys.map((key, i) => <li key={i} className="text-xs text-indigo-300/80 truncate">{key}</li>)}
                                </ul>
                            </div>
                        )}

                        {selectedColumns && selectedColumns.length > 0 && (
                            <div className="bg-slate-950/50 border border-slate-700 rounded-md p-3">
                                <small className="block mb-1 text-slate-500 font-semibold text-xs">Data Source</small>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {selectedColumns.map((col, i) => <li key={i} className="text-xs text-slate-400 truncate">{col}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Cache Stats */}
            <div className="p-6 mt-auto bg-slate-800/20">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Response Cache</label>
                {cacheStats && (
                    <div className="flex gap-4 mb-3 text-sm">
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-xs">Cached</span>
                            <strong className="text-green-400">{cacheStats.active_entries || 0}</strong>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-xs">Expired</span>
                            <strong className="text-red-400">{cacheStats.expired_entries || 0}</strong>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleClearCache}
                    className="w-full rounded-md border border-slate-600 bg-transparent py-2 px-4 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
                >
                    Clear Cache
                </button>
            </div>
        </div>
    );
};

export default Configuration;
