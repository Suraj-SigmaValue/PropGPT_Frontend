/**
 * Configuration Sidebar Component
 * Replicates the Streamlit sidebar functionality
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
        <div className="configuration-sidebar">
            <div className="config-header">
                <h2>Configuration</h2>
                <p>Set analysis parameters</p>
            </div>

            {/* Comparison Type */}
            <div className="config-section">
                <label>Comparison Type</label>
                <select
                    value={comparisonType}
                    onChange={(e) => {
                        setComparisonType(e.target.value);
                        setSelectedItems([]);
                        setSearchTerm('');
                        clearChat();
                    }}
                >
                    <option value="Location">Location</option>
                    <option value="City">City</option>
                    <option value="Project">Project</option>
                </select>
            </div>

            {/* LLM Providers */}
            <div className="config-section">
                <label>Mapping LLM Provider</label>
                <select
                    value={mappingLLMProvider}
                    onChange={(e) => setMappingLLMProvider(e.target.value)}
                >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Google Gemini">Google Gemini</option>
                </select>
            </div>

            <div className="config-section">
                <label>Response LLM Provider</label>
                <select
                    value={responseLLMProvider}
                    onChange={(e) => setResponseLLMProvider(e.target.value)}
                >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Google Gemini">Google Gemini</option>
                </select>
            </div>

            {/* Items Selection */}
            <div className="config-section">
                <label>Select {comparisonType}s</label>

                {/* Selected Items Chips */}
                {selectedItems.length > 0 && (
                    <div className="selected-items-container">
                        {selectedItems.map(item => (
                            <div key={item} className="selected-item-tag">
                                <span>{item}</span>
                                <span
                                    className="remove-tag"
                                    onClick={() => setSelectedItems(selectedItems.filter(i => i !== item))}
                                    title="Remove"
                                >
                                    &times;
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginBottom: '0.75rem' }}>
                    <input
                        type="text"
                        placeholder={`Search ${comparisonType}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="multi-select-dropdown">
                        {availableItems
                            .filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(item => (
                                <div key={item} className="checkbox-item">
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
                                    />
                                    <label htmlFor={`item-${item}`}>{item}</label>
                                </div>
                            ))}
                    </div>
                )}
                <small>{selectedItems.length} / 5 selected</small>
            </div>

            {/* Categories */}
            <div className="config-section">
                <label>Analysis Categories</label>
                {categories.map(cat => (
                    <div key={cat} className="checkbox-item">
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
                        />
                        <label htmlFor={cat}>{cat}</label>
                    </div>
                ))}
            </div>

            {/* Year Filter - Only show for Location and City, not for Project */}
            {comparisonType.toLowerCase() !== 'project' && (
                <div className="config-section">
                    <label>Select Years</label>
                    {[2020, 2021, 2022, 2023, 2024].map(year => (
                        <div key={year} className="checkbox-item">
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
                            />
                            <label htmlFor={`year-${year}`}>{year}</label>
                        </div>
                    ))}
                </div>
            )}

            {messages.length > 0 && (() => {
                const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
                if (!lastAssistantMessage?.metadata) return null;

                const { mappingKeys, selectedColumns } = lastAssistantMessage.metadata;

                const boxStyle = {
                    backgroundColor: '#0b0314ff',
                    border: '1px solid #2b22b1ff',
                    borderRadius: '6px',
                    padding: '10px',
                    marginBottom: '10px'
                };

                return (
                    <div className="config-section analysis-details">
                        <label style={{ marginBottom: '10px', display: 'block' }}>Analysis Details</label>

                        {mappingKeys && mappingKeys.length > 0 && (
                            <div className="detail-group" style={boxStyle}>
                                <small style={{ display: 'block', marginBottom: '5px', color: '#6c757d' }}><strong>Mapping Keys</strong></small>
                                <ul className="detail-list" style={{ margin: 0, paddingLeft: '20px' }}>
                                    {mappingKeys.map((key, i) => <li key={i}><small>{key}</small></li>)}
                                </ul>
                            </div>
                        )}

                        {selectedColumns && selectedColumns.length > 0 && (
                            <div className="detail-group" style={boxStyle}>
                                <small style={{ display: 'block', marginBottom: '5px', color: '#6c757d' }}><strong>Data Source</strong></small>
                                <ul className="detail-list" style={{ margin: 0, paddingLeft: '20px' }}>
                                    {selectedColumns.map((col, i) => <li key={i}><small>{col}</small></li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Cache Stats */}
            <div className="config-section">
                <label>Response Cache</label>
                {cacheStats && (
                    <div className="cache-stats">
                        <div className="stat">
                            <span>Cached:</span>
                            <strong>{cacheStats.active_entries || 0}</strong>
                        </div>
                        <div className="stat">
                            <span>Expired:</span>
                            <strong>{cacheStats.expired_entries || 0}</strong>
                        </div>
                    </div>
                )}
                <button onClick={handleClearCache} className="btn-secondary">
                    Clear Cache
                </button>
            </div>
        </div>
    );
};

export default Configuration;
