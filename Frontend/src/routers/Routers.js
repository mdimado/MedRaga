import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import ChatBot from '../pages/ChatBot';
import Login from "../pages/Login";
import Signup from "../pages/Signup"



import ProtectedRoute from './ProtectedRoute';



const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="home" />} />
      <Route path="home" element={<Home />} />
     
      

      <Route path="/*" element={<ProtectedRoute />}>
      <Route path="Chatbot" element={<ChatBot />} />
      </Route>

      
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      
    </Routes>
  );
};

export default Routers;
