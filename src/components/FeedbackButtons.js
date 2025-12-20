/**
 * FeedbackButtons Component
 * HITL thumbs up/down functionality
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
            <div className="feedback-submitted">
                {feedback === 'up' ? '👍 Thank you!' : '👎 Feedback received'}
            </div>
        );
    }

    return (
        <div className="feedback-buttons">
            <p>Please rate this answer:</p>
            <div className="button-group">
                <button
                    onClick={() => handleFeedback('up')}
                    disabled={loading}
                    className="btn-feedback btn-thumbs-up"
                    title="Accurate and helpful"
                >
                    👍
                </button>
                <button
                    onClick={() => handleFeedback('down')}
                    disabled={loading}
                    className="btn-feedback btn-thumbs-down"
                    title="Inaccurate or wrong mapping"
                >
                    👎
                </button>
            </div>
        </div>
    );
};

export default FeedbackButtons;
