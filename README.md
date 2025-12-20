# PropGPT Frontend - React Application

## Setup Instructions

### 1. Install Dependencies
```bash
cd propgpt-frontend
npm install
```

### 2. Configure Environment
```bash
# Create .env file
echo REACT_APP_API_URL=http://localhost:8000/api > .env
```

### 3. Run Development Server
```bash
npm start
```

Application will open at `http://localhost:3000`

---

## Features

✅ **Chat Interface**: WhatsApp-style chat with message history
✅ **Configuration Sidebar**: 
   - Comparison type selection (Location/City/Project)
   - LLM provider selection (OpenAI/Google Gemini)
   - Item multi-select (5 max)
   - Category selection
   - Cache statistics and management

✅ **HITL Feedback**: Thumbs up/down buttons for response quality
✅ **Dark Mode**: Professional dark theme matching Streamlit
✅ **Markdown Support**: Rich text rendering for LLM responses
✅ **Response Caching**: Visual indicators for cached responses

---

## Project Structure

```
src/
├── api/
│   ├── client.js          # Axios configuration
│   └── endpoints.js       # API wrapper functions (13 endpoints)
├── components/
│   ├── ChatInterface.js   # Main chat UI
│   ├── Configuration.js   # Sidebar configuration
│   └── FeedbackButtons.js # HITL feedback
├── context/
│   └── AppContext.js      # Global state management
├── styles/
│   └── App.css            # Dark mode styling
├── App.js                 # Main app component
└── index.js               # Entry point
```

---

## Development

### Environment Variables
- `REACT_APP_API_URL`: Backend API base URL (default: http://localhost:8000/api)

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

---

## API Integration

All backend endpoints are wrapped in `src/api/endpoints.js`:

- `executeQuery()` - Main query execution
- `loadMappings()` - Load mappings for comparison type
- `getComparisonItems()` - Get available items
- `runPlannerAgent()` - Execute planner agent
- `runColumnAgent()` - Execute column selection agent
- `runCorrectionAgent()` - Execute correction agent (HITL)
- `executeGraph()` - Execute LangGraph workflow
- `getCacheStats()` - Get cache statistics
- `clearCache()` - Clear response cache
- `checkRelevance()` - Check query relevance
- `submitFeedback()` - Submit HITL feedback
- `getProjectRecommendations()` - Get project recommendations

---

## Component Documentation

### `<ChatInterface />`
Main chat interface with:
- Message rendering (user/assistant/error)
- Markdown support via `react-markdown`
- Loading states
- Token usage display
- HITL feedback integration

### `<Configuration />`
Sidebar configuration panel:
- Comparison type selector
- LLM provider dropdowns (mapping & response)
- Item selection (dynamic loading based on type)
- Category checkboxes
- Cache stats and clear button

### `<FeedbackButtons />`
HITL feedback component:
- Thumbs up: Logs positive feedback
- Thumbs down: Triggers correction agent, proposes new mappings

### `<AppContext>`
Global state management via React Context:
- Chat messages
- Configuration (comparison type, items, categories, LLM providers)
- UI state (loading, errors)
- Cache statistics

---

## Notes

- **Zero Backend Modification**: Frontend calls Django REST API that wraps original functions
- **State Persistence**: Uses React Context for session state
- **Responsive Design**: Mobile-friendly layout
- **Error Handling**: Comprehensive error messages and fallbacks
