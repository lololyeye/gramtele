import '@fontsource-variable/hanken-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import { createRoot } from 'react-dom/client';
import './i18n/fr';
import { App } from './ui/App';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/shell.css';
import './ui/styles/messenger.css';
import './ui/styles/views.css';

createRoot(document.getElementById('root')!).render(<App />);
