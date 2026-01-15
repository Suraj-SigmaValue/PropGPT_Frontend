/**
 * ChatInterface Component
 * Main chat interface with message history and input
 * Updated with Dynamic Multi-Box Layout and Premium Design
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { executeQuery, downloadBasicReport, generateStructuredReport } from '../api/endpoints';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FeedbackButtons from './FeedbackButtons';
import DataSourceDisplay from './DataSourceDisplay';

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

    const parseComparisonContent = (content, items) => {
        if (!items || items.length <= 1) return null;

        const sections = {};
        const normalizedItems = items.map(i => i.toLowerCase());
        let currentItem = null;
        let generalContent = "";

        const lines = content.split('\n');

        // Strategy: Look for headers that match selected items
        lines.forEach(line => {
            const trimmedLine = line.trim();
            // Match ### Item or [Item] or **Item**
            const headerMatch = trimmedLine.match(/^(?:###|\[|\*\*)\s*(.*?)\s*(?:\]|\*\*|$)/);

            if (headerMatch) {
                const potentialItem = headerMatch[1].trim().toLowerCase();
                const itemIndex = normalizedItems.indexOf(potentialItem);

                if (itemIndex !== -1) {
                    currentItem = items[itemIndex];
                    if (!sections[currentItem]) sections[currentItem] = "";
                    return;
                }
            }

            if (currentItem) {
                sections[currentItem] += line + '\n';
            } else {
                generalContent += line + '\n';
            }
        });

        // If we didn't find multiple sections, return null
        const foundItems = Object.keys(sections);
        if (foundItems.length < 2) return null;

        return { generalContent, sections, foundItems };
    };

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

        // Estimate time based on backend benchmarks (minimum 55s)
        const qCount = (userQuery.match(/and|\?|\n/gi) || []).length + 1;
        const estimatedSeconds = Math.max(55, 10 + (selectedItems.length * 5) + (selectedCategories.length * 3) + (qCount * 10));
        setEstimatedTime(estimatedSeconds);
        setCountdown(estimatedSeconds);

        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // Do not clear interval until loading is false, just stop at 0
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
                columnsWithSources: data.columns_with_sources,
                inputTokens: data.input_tokens,
                outputTokens: data.output_tokens,
                cached: data.cached,
                timeMessage: data.estimated_time_message,
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

    const AssistantMessage = ({ message, index }) => {
        const comparison = useMemo(() =>
            parseComparisonContent(message.content, selectedItems),
            [message.content, selectedItems]
        );

        const renderMarkdown = (content) => (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content
                    // Convert [Header] to ### Header
                    .replace(/^\[(.*?)\]$/gm, '### $1')
                    // Ensure newlines after headers if they are sticking to text
                    .replace(/### (.*?)\n(?!\n)/g, '### $1\n\n')
                }
            </ReactMarkdown>
        );

        return (
            <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`
                    relative w-full rounded-2xl p-6 shadow-xl border border-slate-700/50
                    bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl text-slate-200
                `}>
                    {message.metadata?.cached && (
                        <div className="absolute -top-3 right-6 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-500/10">
                            ⚡ OPTIMIZED FROM CACHE
                        </div>
                    )}

                    {comparison ? (
                        <div className="space-y-6">
                            {comparison.generalContent.trim() && (
                                <div className="prose prose-invert prose-sm max-w-none mb-6 pb-6 border-b border-slate-700/50 font-medium text-slate-300 italic">
                                    {renderMarkdown(comparison.generalContent)}
                                </div>
                            )}
                            <div className={`grid gap-6 grid-cols-1 ${comparison.foundItems.length === 2 ? 'md:grid-cols-2' :
                                comparison.foundItems.length >= 3 ? 'md:grid-cols-3' : ''
                                }`}>
                                {comparison.foundItems.map((itemName, i) => (
                                    <div key={i} className="flex flex-col h-full bg-slate-950/40 rounded-xl border border-blue-500/10 overflow-hidden shadow-inner group hover:border-blue-500/30 transition-all duration-300">
                                        <div className="bg-blue-600/10 px-4 py-2 border-b border-blue-500/10 flex items-center justify-between group-hover:bg-blue-600/20 transition-colors">
                                            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">{itemName}</span>
                                            <div className="w-2 h-2 rounded-full bg-blue-500/50 animate-pulse"></div>
                                        </div>
                                        <div className="p-5 prose prose-invert prose-sm max-w-none flex-1">
                                            {renderMarkdown(comparison.sections[itemName])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                            {renderMarkdown(message.content)}
                        </div>
                    )}

                    {/* Data Sources Display */}
                    {message.metadata?.columnsWithSources && (
                        <div className="mt-6 pt-6 border-t border-slate-700/50">
                            <DataSourceDisplay columnsWithSources={message.metadata.columnsWithSources} />
                        </div>
                    )}

                    {message.metadata && (
                        <>
                            <div className="mt-6 pt-4 border-t border-slate-700/30 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-tighter text-slate-500 font-bold">Analysis tokens</span>
                                        <small className="text-xs text-slate-400 font-mono">
                                            {message.metadata.inputTokens || 0} I / {message.metadata.outputTokens || 0} O
                                        </small>
                                    </div>
                                    <div className="h-6 w-px bg-slate-700/50 mx-2"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-tighter text-slate-500 font-bold">Model Path</span>
                                        <span className="text-[10px] text-blue-400/70 font-mono tracking-tight">{responseLLMProvider}</span>
                                    </div>
                                    {message.metadata.timeMessage && (
                                        <>
                                            <div className="h-6 w-px bg-slate-700/50 mx-2"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] uppercase tracking-tighter text-slate-500 font-bold">Wait Time</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{message.metadata.timeMessage}</span>
                                            </div>
                                        </>
                                    )}
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
                                                    columnsWithSources: data.columns_with_sources,
                                                    inputTokens: data.input_tokens,
                                                    outputTokens: data.output_tokens,
                                                    cached: data.cached,
                                                    timeMessage: data.estimated_time_message,
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
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl shrink-0 relative z-50 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-xl">📊</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight uppercase italic leading-none">PropGPT <span className="text-blue-500">v3.0</span></h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Intelligence Layer • Real Estate</p>
                    </div>
                </div>
                <div className="flex items-center gap-4" ref={menuRef}>
                    <div className="hidden lg:flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{selectedItems.length} {comparisonType}s Active</span>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
                            disabled={isGeneratingReport || messages.length === 0}
                            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all shadow-lg text-sm font-bold tracking-tight border ${isGeneratingReport
                                ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-70 cursor-not-allowed'
                                : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {isGeneratingReport ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>GENERATING...</span>
                                </>
                            ) : (
                                <>
                                    <span>DOWNLOAD ANALYSIS</span>
                                    <span className={`transition-transform duration-300 ${isReportMenuOpen ? 'rotate-180' : ''}`}>▼</span>
                                </>
                            )}
                        </button>

                        {/* Report Dropdown Menu */}
                        {isReportMenuOpen && (
                            <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
                                <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Select Format</span>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={() => handleGenerateStructuredReport('quick')}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-600/10 transition-all group flex items-start gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">⚡</div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-200">Quick Report</div>
                                            <div className="text-[10px] text-slate-500 mt-1">Executive summary & key metrics charts.</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleGenerateStructuredReport('institutional')}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-600/10 transition-all group flex items-start gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">🏢</div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-200">Institutional Grade</div>
                                            <div className="text-[10px] text-slate-500 mt-1">Full investment advisory & strategic analysis.</div>
                                        </div>
                                    </button>
                                </div>
                                <div className="p-2 border-t border-slate-700/50 bg-slate-950/30">
                                    <button
                                        onClick={handleDownloadBasicReport}
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors flex items-center gap-3"
                                    >
                                        <div className="w-5 text-center text-xs">📄</div>
                                        <div className="font-bold text-xs uppercase tracking-wider">Basic Chat History</div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10 scroll-smooth">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-6xl animate-pulse">🏙️</div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shadow-xl">✨</div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">PropGPT Engine <span className="text-blue-500">Standby</span></h2>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Select <span className="text-blue-400 font-bold">{comparisonType}s</span> from the sidebar and categories for analysis.
                                Our AI will cross-reference data sources to provide high-precision insights.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full pt-4">
                            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-left hover:border-blue-500/30 transition-colors cursor-default">
                                <span className="text-blue-500 font-bold block mb-1">COMPARE ANY</span>
                                <p className="text-xs text-slate-500 leading-none">Side-by-side analysis of villages, projects, or cities.</p>
                            </div>
                            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl text-left hover:border-indigo-500/30 transition-colors cursor-default">
                                <span className="text-indigo-500 font-bold block mb-1">AI STRATEGY</span>
                                <p className="text-xs text-slate-500 leading-none">Institutional grade reports & investment advisory.</p>
                            </div>
                        </div>
                    </div>
                )}
                {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                        {message.role === 'user' ? (
                            <div className="relative max-w-[70%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-6 py-4 shadow-xl shadow-blue-500/10 border border-blue-400/20 animate-in slide-in-from-right-4 duration-500">
                                <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            </div>
                        ) : message.role === 'assistant' ? (
                            <AssistantMessage message={message} index={index} />
                        ) : (
                            <div className="bg-red-500/10 text-red-400 border border-red-500/20 w-full max-w-lg mx-auto rounded-2xl p-6 text-center backdrop-blur-md">
                                <div className="text-2xl mb-2">⚠️</div>
                                <div className="text-sm font-black uppercase tracking-widest">{message.content}</div>
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start w-full animate-in fade-in duration-300">
                        <div className="bg-slate-900/80 backdrop-blur-xl transition-all text-slate-200 rounded-2xl rounded-tl-sm p-6 border border-blue-500/20 shadow-2xl flex flex-col gap-4 min-w-[300px]">
                            <div className="flex items-center gap-4">
                                <div className="flex space-x-1.5">
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-sm font-black text-white italic leading-none tracking-tight">Analyzing Intelligence Matrix...</span>
                            </div>

                            {estimatedTime > 0 && (
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Computing Sequence</span>
                                        <span className="text-blue-400">{Math.round(Math.min(100, (1 - countdown / estimatedTime) * 100))}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000 ease-linear rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            style={{ width: `${Math.min(100, (1 - countdown / estimatedTime) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic">
                                        {countdown > 0
                                            ? `Estimated completion in ~${countdown}s`
                                            : "Please wait, response will display soon"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-10" />
            </div>

            {/* Input Area */}
            <div className="p-8 border-t border-slate-800 bg-slate-900/80 backdrop-blur-2xl shrink-0 relative z-50">
                <form onSubmit={handleSubmit} className="relative max-w-5xl mx-auto group">
                    <div className="absolute inset-0 bg-blue-500/5 blur-xl group-focus-within:bg-blue-500/10 transition-colors rounded-full"></div>
                    <div className="relative flex items-center bg-slate-800/80 border-2 border-slate-700/50 rounded-2xl p-2 focus-within:border-blue-500/50 shadow-2xl transition-all duration-300">
                        <div className="pl-4 pr-2 text-xl opacity-50">💬</div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={loading ? "Computing analysis..." : `Ask anything about the selected ${comparisonType}s...`}
                            disabled={loading}
                            className="flex-1 bg-transparent text-white border-none px-4 py-3 focus:ring-0 outline-none text-sm font-bold tracking-tight placeholder-slate-600 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={loading || !inputValue.trim()}
                            className="bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black px-8 py-3 rounded-xl transition-all disabled:opacity-30 disabled:grayscale disabled:scale-95 text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-90"
                        >
                            Execute
                        </button>
                    </div>
                    {selectedItems.length > 0 && (
                        <div className="mt-3 flex justify-center gap-3">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Context:</span>
                            <div className="flex flex-wrap gap-2">
                                {selectedItems.map(item => (
                                    <span key={item} className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{item}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
