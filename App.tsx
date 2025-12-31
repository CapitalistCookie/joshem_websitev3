import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Menu from './components/Menu';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Admin from './components/Admin';
import OrderPage from './components/OrderPage';

const MainLayout: React.FC = () => {
  return (
    <>
      <Navbar />
      <Hero id="hero" />
      <About id="about" />
      <Menu id="menu" />
      <Testimonials id="testimonials" />
      <Contact id="contact" />
      <Footer />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
};

export default App;