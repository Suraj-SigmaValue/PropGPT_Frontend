/**
 * API Endpoints
 * Wrapper functions for all 70 backend endpoints
 */

import apiClient from './client';

// Main Query Endpoint
export const executeQuery = (data) => {
    return apiClient.post('/query/', data);
};

// Data Management
export const loadMappings = (comparisonType) => {
    return apiClient.post('/mappings/load/', { comparison_type: comparisonType });
};

export const getComparisonItems = (comparisonType) => {
    return apiClient.post('/items/', { comparison_type: comparisonType });
};

export const getProjectRecommendations = () => {
    return apiClient.get('/projects/recommendations/');
};

// Agent Endpoints
export const runPlannerAgent = (query, candidateKeys, llmProvider = 'openai') => {
    return apiClient.post('/agents/planner/', {
        query,
        candidate_keys: candidateKeys,
        llm_provider: llmProvider
    });
};

export const runColumnAgent = (query, selectedKeys, candidateColumns, llmProvider = 'openai') => {
    return apiClient.post('/agents/column/', {
        query,
        selected_keys: selectedKeys,
        candidate_columns: candidateColumns,
        llm_provider: llmProvider
    });
};

export const runCorrectionAgent = (query, oldKeys, candidateKeys, llmProvider = 'openai') => {
    return apiClient.post('/agents/correction/', {
        query,
        old_keys: oldKeys,
        candidate_keys: candidateKeys,
        llm_provider: llmProvider
    });
};

// LangGraph
export const executeGraph = (query, comparisonType, candidateKeys, llmProvider = 'openai') => {
    return apiClient.post('/graph/execute/', {
        query,
        comparison_type: comparisonType,
        candidate_keys: candidateKeys,
        llm_provider: llmProvider
    });
};

// Cache Management
export const getCacheStats = () => {
    return apiClient.get('/cache/stats/');
};

export const clearCache = () => {
    return apiClient.post('/cache/clear/');
};

// Utilities
export const checkRelevance = (query, llmProvider = 'openai') => {
    return apiClient.post('/relevance/', {
        query,
        llm_provider: llmProvider
    });
};

// HITL Feedback
export const submitFeedback = (feedbackData) => {
    return apiClient.post('/feedback/', feedbackData);
};

// Export all as named exports
const api = {
    executeQuery,
    loadMappings,
    getComparisonItems,
    getProjectRecommendations,
    runPlannerAgent,
    runColumnAgent,
    runCorrectionAgent,
    executeGraph,
    getCacheStats,
    clearCache,
    checkRelevance,
    submitFeedback,
};

export default api;
