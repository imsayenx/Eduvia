import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'sileo/styles.css'
import './index.css'
import App from './App'
import { initTheme } from './theme'

initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
