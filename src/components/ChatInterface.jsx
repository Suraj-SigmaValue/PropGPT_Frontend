/**
 * ChatInterface Component
 * Main chat interface with message history and input
 * Updated with Tailwind CSS
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { executeQuery, downloadBasicReport, generateStructuredReport } from '../api/endpoints';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FeedbackButtons from './FeedbackButtons';
// import GraphDisplay from './GraphDisplay';

const ChatInterface = () => {
    const {
        messages,
        addMessage,
        comparisonType,
        selectedItems,
        selectedCategories,
        selectedYears,
        mappingLLMProvider,
        responseLLMProvider,
        loading,
        setLoading,
        setError,
    } = useApp();

    const [inputValue, setInputValue] = useState('');
    const [estimatedTime, setEstimatedTime] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const messagesEndRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const menuRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle clicks outside the report menu to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsReportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            categories: selectedCategories.map(cat => cat.toLowerCase()), // Convert to lowercase for backend
            comparison_type: comparisonType,
            mapping_llm_provider: mappingLLMProvider.toLowerCase().replace(' ', '_'),
            response_llm_provider: responseLLMProvider.toLowerCase().replace(' ', '_'),
            years: comparisonType.toLowerCase() === 'project' ? null : selectedYears,
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

    const downloadFile = (response, filename) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadBasicReport = async () => {
        setIsReportMenuOpen(false);
        setIsGeneratingReport(true);
        try {
            const response = await downloadBasicReport();
            downloadFile(response, 'propgpt_basic_report.pdf');
        } catch (error) {
            console.error('Basic report download error:', error);
            alert('Failed to download basic report.');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleGenerateStructuredReport = async (preset) => {
        setIsReportMenuOpen(false);
        setIsGeneratingReport(true);

        let sections = [];
        if (preset === 'quick') {
            sections = ['Executive Summary', 'Market Overview', 'Charts & Visuals'];
        } else if (preset === 'institutional') {
            sections = ['Executive Summary', 'Market Overview', 'Charts & Visuals', 'Investment Advisory', 'Strategic Synthesis', 'Detailed Intelligence Analysis'];
        }

        try {
            const response = await generateStructuredReport({
                sections,
                preset
            });
            downloadFile(response, `propgpt_${preset}_report.pdf`);
        } catch (error) {
            console.error('Structured report generation error:', error);
            alert('Failed to generate structured report. Ensure you have a relevant chat history.');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-900/40 backdrop-blur-md shrink-0 relative z-50">
                <div>
                    <h1 className="text-lg font-bold text-white tracking-tight">Real Estate Analysis Platform</h1>
                    <p className="text-xs text-slate-400">Advanced AI-powered comparative analysis of real estate metrics</p>
                </div>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
                        disabled={isGeneratingReport || messages.length === 0}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all shadow-sm text-xs font-medium border ${isGeneratingReport
                            ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-70 cursor-not-allowed'
                            : 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30 hover:text-blue-300'
                            }`}
                        title="Download Analysis Report"
                    >
                        {isGeneratingReport ? (
                            <>
                                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <span>Download Report</span>
                                <span className={`transition-transform duration-200 ${isReportMenuOpen ? 'rotate-180' : ''}`}>▼</span>
                            </>
                        )}
                    </button>

                    {/* Report Dropdown Menu */}
                    {isReportMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden backdrop-blur-xl bg-slate-800/90 animate-in fade-in zoom-in duration-200">
                            <div className="p-2 border-b border-slate-700/50">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Report Presets</span>
                            </div>
                            <div className="p-1">
                                <button
                                    onClick={() => handleGenerateStructuredReport('quick')}
                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-600/10 hover:text-blue-300 transition-colors group"
                                >
                                    <div className="font-bold text-sm">⚡ Quick Report</div>
                                    <div className="text-[10px] text-slate-400 group-hover:text-slate-300">Executive summary & market overview.</div>
                                </button>
                                <button
                                    onClick={() => handleGenerateStructuredReport('institutional')}
                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-600/10 hover:text-blue-300 transition-colors group"
                                >
                                    <div className="font-bold text-sm">🏢 Institutional Grade</div>
                                    <div className="text-[10px] text-slate-400 group-hover:text-slate-300">Full analysis with investment advisory.</div>
                                </button>
                            </div>
                            <div className="p-2 border-y border-slate-700/50">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Legacy</span>
                            </div>
                            <div className="p-1">
                                <button
                                    onClick={handleDownloadBasicReport}
                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-700 text-slate-300 transition-colors"
                                >
                                    <div className="font-semibold text-xs">📄 Basic Chat History</div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <div className="text-6xl mb-4">🏙️</div>
                        <p className="text-sm">Select items from the sidebar and start asking questions.</p>
                    </div>
                )}
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            relative max-w-[85%] rounded-2xl p-5 shadow-sm
                            ${message.role === 'user'
                                ? 'bg-blue-600/80 backdrop-blur-md text-white rounded-tr-sm'
                                : message.role === 'assistant'
                                    ? 'bg-slate-800/60 backdrop-blur-md text-slate-200 rounded-tl-sm border border-slate-700/50'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20 w-full max-w-lg mx-auto text-center'
                            }
                        `}>
                            {message.role === 'error' ? (
                                <div className="text-sm font-medium">{message.content}</div>
                            ) : message.role === 'user' ? (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            ) : (
                                <>
                                    {message.metadata?.cached && (
                                        <div className="absolute -top-3 right-4 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            ⚡ Cache Hit
                                        </div>
                                    )}
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content
                                                // Convert [Header] to ### Header
                                                .replace(/^\[(.*?)\]$/gm, '### $1')
                                                // Ensure newlines after headers if they are sticking to text
                                                .replace(/### (.*?)\n(?!\n)/g, '### $1\n\n')
                                            }
                                        </ReactMarkdown>
                                    </div>

                                    {/* <GraphDisplay content={message.content} /> */}

                                    {message.metadata && (
                                        <>
                                            <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                                                <small className="text-[10px] text-slate-500 font-mono">
                                                    Input: {message.metadata.inputTokens || 0} • Output: {message.metadata.outputTokens || 0}
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
                                                        categories: selectedCategories.map(cat => cat.toLowerCase()),
                                                        comparison_type: comparisonType,
                                                        mapping_llm_provider: mappingLLMProvider.toLowerCase().replace(' ', '_'),
                                                        response_llm_provider: responseLLMProvider.toLowerCase().replace(' ', '_'),
                                                        years: comparisonType.toLowerCase() === 'project' ? null : selectedYears,
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
                    <div className="flex justify-start">
                        <div className="bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm p-4 border border-slate-700/50 shadow-sm flex items-center gap-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-sm text-slate-400 font-medium">Analyzing...</span>
                            {estimatedTime > 0 && (
                                <span className="text-xs text-slate-500 ml-2 border-l border-slate-600 pl-3">
                                    ~{countdown}s remaining
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/40 backdrop-blur-md shrink-0">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={loading ? "Analysis in progress..." : "Ask a question about the selected items..."}
                        disabled={loading}
                        className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-4 py-3 pr-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm placeholder-slate-500 transition-all font-medium"
                    />
                    <button
                        type="submit"
                        disabled={loading || !inputValue.trim()}
                        className="absolute right-2 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
