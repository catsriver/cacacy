import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'

import '@radix-ui/themes/styles.css'

import App from './App.tsx'
import { BrowserRouter } from 'react-router'

createRoot(document.getElementById('root')!).render(
    <Theme>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Theme>
)
