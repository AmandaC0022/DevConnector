import React, { Fragment } from 'react'; 
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; 
import './App.css';
import Landing from './components/layout/Landing';
import Navbar from "./components/layout/Navbar";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} /> 
      </Routes>
    </Router>
  );
}

export default App;

//Routes has replaced Switch according to the React Docs 