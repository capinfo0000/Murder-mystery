import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import HandoutPage from './pages/HandoutPage'
import DiscussionPage from './pages/DiscussionPage'
import VotingPage from './pages/VotingPage'
import ResultPage from './pages/ResultPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:gameId" element={<LobbyPage />} />
        <Route path="/handout/:gameId" element={<HandoutPage />} />
        <Route path="/game/:gameId" element={<DiscussionPage />} />
        <Route path="/vote/:gameId" element={<VotingPage />} />
        <Route path="/result/:gameId" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  )
}
