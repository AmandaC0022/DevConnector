import React, { Fragment } from 'react'; 
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; 
import './App.css';
import Login from './components/auth/Login';
import Landing from './components/layout/Landing';
import Navbar from "./components/layout/Navbar";
import Register from './components/auth/Register';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />  
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;

//Routes has replaced Switch according to the React Docs 