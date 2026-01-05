/**
 * FeedbackButtons Component
 * HITL thumbs up/down functionality
 * Updated with Tailwind CSS
 */

import React, { useState } from 'react';
import { submitFeedback } from '../api/endpoints';

const FeedbackButtons = ({ query, items, categories, mappingKeys, comparisonType, onCorrection }) => {
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFeedback = async (type) => {
        setLoading(true);
        try {
            const response = await submitFeedback({
                query,
                items,
                categories,
                old_mapping_keys: mappingKeys,
                comparison_type: comparisonType,
                feedback_type: type,
            });

            setFeedback(type);

            if (type === 'up') {
                alert('Thank you for your feedback!');
            } else {
                const data = response.data;
                if (data.new_mapping_keys && onCorrection) {
                    // Trigger correction in parent component
                    onCorrection(data.new_mapping_keys);
                } else if (data.new_mapping_keys) {
                    // Fallback if no callback provided
                    alert(`New mapping keys proposed: ${data.new_mapping_keys.join(', ')}`);
                }
            }
        } catch (error) {
            console.error('Feedback error:', error);
            alert('Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    if (feedback) {
        return (
            <div className="mt-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 p-2 rounded inline-block border border-emerald-400/20">
                {feedback === 'up' ? '👍 Thank you!' : '👎 Feedback received'}
            </div>
        );
    }

    return (
        <div className="mt-4 pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-500 mb-2">Rate this answer:</p>
            <div className="flex space-x-2">
                <button
                    onClick={() => handleFeedback('up')}
                    disabled={loading}
                    className="p-1.5 rounded-md hover:bg-slate-700/70 text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    title="Accurate and helpful"
                >
                    👍
                </button>
                <button
                    onClick={() => handleFeedback('down')}
                    disabled={loading}
                    className="p-1.5 rounded-md hover:bg-slate-700/70 text-slate-400 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400/50"
                    title="Inaccurate or wrong mapping"
                >
                    👎
                </button>
            </div>
        </div>
    );
};

export default FeedbackButtons;
