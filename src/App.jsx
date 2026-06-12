import { useState } from 'react'
import AppBackground from './components/AppBackground'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="flex h-screen flex-col overflow-hidden text-white">
      <AppBackground />
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar current={page} onNavigate={setPage} />
        <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2 lg:px-7">
          <div key={page} className="mx-auto max-w-[1400px] animate-fade-in">
            {page === 'dashboard' && (
              <Dashboard
                onOpenAssistant={() => setPage('assistant')}
                onNavigate={setPage}
              />
            )}
            {page === 'history' && <History onNavigate={setPage} />}
            {page === 'assistant' && <Assistant onNavigate={setPage} />}
            {page === 'settings' && <Settings onConnected={() => setPage('dashboard')} />}
          </div>
        </main>
      </div>
    </div>
  )
}
