import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { EditorPage } from './pages/EditorPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

  return (
    <BrowserRouter basename={basename || undefined}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<EditorPage />} />
        <Route path="/edit/:id" element={<EditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
