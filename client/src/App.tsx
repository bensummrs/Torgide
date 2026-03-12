import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AddPin from './pages/AddPin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-pin" element={<AddPin />} />
      </Routes>
    </BrowserRouter>
  )
}
