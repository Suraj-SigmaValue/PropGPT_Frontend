/**
 * DataSourceDisplay Component
 * Displays data sources for columns in a beautiful, modern card layout
 */

import React, { useState } from 'react';

const DataSourceDisplay = ({ columnsWithSources }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!columnsWithSources || columnsWithSources.length === 0) {
        return null;
    }

    // Group columns by source
    const groupedBySource = columnsWithSources.reduce((acc, item) => {
        const source = item.source || 'Unknown';
        if (!acc[source]) {
            acc[source] = [];
        }
        acc[source].push(item.column);
        return acc;
    }, {});

    // Get source badge color
    const getSourceColor = (source) => {
        const colors = {
            'RERA': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
            'IGR': 'bg-green-500/20 text-green-300 border-green-500/40',
            'IGR-CGDB': 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            'DA': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
            'IGR+RERA': 'bg-teal-500/20 text-teal-300 border-teal-500/40',
            'Unknown': 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        };
        return colors[source] || colors['Unknown'];
    };

    // Get source icon
    const getSourceIcon = (source) => {
        const icons = {
            'RERA': '🏢',
            'IGR': '📝',
            'IGR-CGDB': '📊',
            'DA': '📋',
            'IGR+RERA': '🔗',
            'Unknown': '❓',
        };
        return icons[source] || icons['Unknown'];
    };

    return (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between group hover:bg-slate-700/20 rounded-lg p-2 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        📊 Data Sources
                    </span>
                    <span className="text-[10px] bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                        {columnsWithSources.length} columns
                    </span>
                </div>
                <span className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Grouped by Source */}
                    <div className="space-y-2">
                        {Object.entries(groupedBySource).map(([source, columns]) => (
                            <div
                                key={source}
                                className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">{getSourceIcon(source)}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded border ${getSourceColor(source)}`}>
                                        {source}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {columns.length} {columns.length === 1 ? 'column' : 'columns'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {columns.map((column, idx) => (
                                        <div
                                            key={idx}
                                            className="text-xs text-slate-300 pl-6 py-1 border-l-2 border-slate-700/50 hover:border-slate-600 hover:bg-slate-700/20 rounded-r transition-colors"
                                        >
                                            {column}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* All Columns List View */}
                    <details className="group/details">
                        <summary className="cursor-pointer text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-slate-400 transition-colors list-none flex items-center gap-1">
                            <span className="group-open/details:rotate-90 transition-transform">▶</span>
                            View All Columns
                        </summary>
                        <div className="mt-2 space-y-1 pl-4 border-l-2 border-slate-700/30">
                            {columnsWithSources.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start justify-between gap-2 py-1.5 hover:bg-slate-700/10 rounded px-2 transition-colors"
                                >
                                    <span className="text-xs text-slate-300 flex-1">
                                        {item.column}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getSourceColor(item.source)}`}>
                                        {item.source}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default DataSourceDisplay;
