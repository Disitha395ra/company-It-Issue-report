import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import Land from '../src/pages/Land.jsx';
import Home from './components/Home.jsx';



function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Land />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
