/**
 * ChatInterface Component
 * Main chat interface with message history and input
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { executeQuery } from '../api/endpoints';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FeedbackButtons from './FeedbackButtons';
import GraphDisplay from './GraphDisplay';

const ChatInterface = () => {
    const {
        messages,
        addMessage,
        comparisonType,
        selectedItems,
        selectedCategories,
        mappingLLMProvider,
        responseLLMProvider,
        loading,
        setLoading,
        setError,
    } = useApp();

    const [inputValue, setInputValue] = useState('');
    const [estimatedTime, setEstimatedTime] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const messagesEndRef = useRef(null);
    const countdownIntervalRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!inputValue.trim()) return;

        if (!selectedItems.length) {
            alert(`Please select at least one ${comparisonType} to analyze.`);
            return;
        }

        if (!selectedCategories.length) {
            alert('Please select at least one category to analyze.');
            return;
        }

        const userQuery = inputValue.trim();
        setInputValue('');

        // Add user message
        addMessage('user', userQuery);

        // Prepare request data
        const requestData = {
            query: userQuery,
            items: selectedItems,
            categories: selectedCategories,
            comparison_type: comparisonType,
            mapping_llm_provider: mappingLLMProvider.toLowerCase().replace(' ', '_'),
            response_llm_provider: responseLLMProvider.toLowerCase().replace(' ', '_'),
            years: comparisonType.toLowerCase() === 'project' ? null : [2020, 2021, 2022, 2023, 2024],
        };

        setLoading(true);
        setError(null);

        // Estimate time based on items and categories (rough estimate)
        const estimatedSeconds = 5 + (selectedItems.length * 2) + (selectedCategories.length * 1);
        setEstimatedTime(estimatedSeconds);
        setCountdown(estimatedSeconds);

        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        try {
            const response = await executeQuery(requestData);
            const data = response.data;

            // Add assistant message with metadata
            addMessage('assistant', data.response_text, {
                mappingKeys: data.mapping_keys,
                selectedColumns: data.selected_columns,
                inputTokens: data.input_tokens,
                outputTokens: data.output_tokens,
                cached: data.cached,
            });
        } catch (error) {
            console.error('Query error:', error);
            setError(error.response?.data?.error || 'An error occurred while processing your query.');
            addMessage('error', error.response?.data?.error || 'An error occurred while processing your query.');
        } finally {
            setLoading(false);
            setEstimatedTime(0);
            setCountdown(0);
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        }
    };

    return (
        <div className="chat-interface">
            <div className="chat-header">
                <h1>Real Estate Analysis Platform</h1>
                <p>Advanced AI-powered comparative analysis of real estate metrics</p>
            </div>

            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message message-${message.role}`}>
                        <div className="message-content">
                            {message.role === 'error' ? (
                                <div className="error-message">{message.content}</div>
                            ) : message.role === 'user' ? (
                                <p>{message.content}</p>
                            ) : (
                                <>
                                    {message.metadata?.cached && (
                                        <div className="cache-badge">⚡ Cache Hit</div>
                                    )}
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {message.content}
                                    </ReactMarkdown>

                                    <GraphDisplay content={message.content} />

                                    {message.metadata && (
                                        <>
                                            <div className="message-metadata">
                                                <small>
                                                    Input Tokens: {message.metadata.inputTokens || 0} |
                                                    Output Tokens: {message.metadata.outputTokens || 0}
                                                </small>
                                            </div>

                                            <FeedbackButtons
                                                query={messages[index - 1]?.content}
                                                items={selectedItems}
                                                categories={selectedCategories}
                                                mappingKeys={message.metadata.mappingKeys}
                                                comparisonType={comparisonType}
                                                onCorrection={(newKeys) => {
                                                    console.log("Applying correction with keys:", newKeys);

                                                    // Re-run the query with new keys
                                                    const originalQuery = messages[index - 1]?.content;

                                                    // Add a system message indicating correction
                                                    addMessage('assistant', '_Generating corrected response based on your feedback..._');

                                                    setLoading(true);

                                                    const requestData = {
                                                        query: originalQuery,
                                                        items: selectedItems,
                                                        categories: selectedCategories,
                                                        comparison_type: comparisonType,
                                                        mapping_llm_provider: mappingLLMProvider.toLowerCase().replace(' ', '_'),
                                                        response_llm_provider: responseLLMProvider.toLowerCase().replace(' ', '_'),
                                                        years: comparisonType.toLowerCase() === 'project' ? null : [2020, 2021, 2022, 2023, 2024],
                                                        forced_mapping_keys: newKeys
                                                    };

                                                    executeQuery(requestData)
                                                        .then(response => {
                                                            const data = response.data;
                                                            addMessage('assistant', data.response_text, {
                                                                mappingKeys: data.mapping_keys,
                                                                selectedColumns: data.selected_columns,
                                                                inputTokens: data.input_tokens,
                                                                outputTokens: data.output_tokens,
                                                                cached: data.cached,
                                                            });
                                                        })
                                                        .catch(error => {
                                                            console.error('Correction error:', error);
                                                            addMessage('error', 'Failed to generate corrected response.');
                                                        })
                                                        .finally(() => {
                                                            setLoading(false);
                                                        });
                                                }}
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="message message-assistant">
                        <div className="message-content">
                            <div className="loading-indicator">
                                <span className="dots">Analyzing</span>
                                {estimatedTime > 0 && (
                                    <div className="estimated-time">
                                        <small>Estimated time: ~{countdown}s</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question about the selected items..."
                    disabled={loading}
                    className="chat-input"
                />
                <button type="submit" disabled={loading} className="btn-primary">
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
