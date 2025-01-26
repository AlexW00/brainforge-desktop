import { Route, HashRouter as Router, Routes } from 'react-router-dom'
import { ForgePicker } from './components/ForgePicker'
import { MainApp } from './components/MainApp'

export function App(): JSX.Element {
  return (
    <Router>
      <Routes>
        <Route path="/forge-picker" element={<ForgePicker />} />
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  )
}
