'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-slate-900 tracking-tighter">
          FOL<span className="text-slate-500"> PS</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#services" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Servicios</Link>
          <Link href="#about" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">Nosotros</Link>
          <Link href="#contact" className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-slate-800 transition-all">
            Solicitar Servicio
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-slate-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white absolute top-full left-0 w-full shadow-xl p-6 flex flex-col gap-4">
          <Link href="#services" onClick={() => setIsMenuOpen(false)} className="text-slate-600 font-medium">Servicios</Link>
          <Link href="#about" onClick={() => setIsMenuOpen(false)} className="text-slate-600 font-medium">Nosotros</Link>
          <Link href="#contact" onClick={() => setIsMenuOpen(false)} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-center font-medium">
            Solicitar Servicio
          </Link>
        </div>
      )}
    </nav>
  );
}
