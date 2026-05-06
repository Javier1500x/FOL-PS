'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 py-20">
      <div className="container mx-auto px-6 flex flex-col items-center text-center z-10">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="relative w-40 h-40 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-slate-900 shadow-2xl bg-white">
            <img
              src="/logo.png"
              alt="FOL PS Logo"
              className="w-full h-full object-contain p-2"
            />
          </div>
        </motion.div>

        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-8xl font-black text-slate-900 mb-4 tracking-tighter"
        >
          FOL <span className="text-blue-600">PS</span>
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="text-lg md:text-2xl text-slate-600 max-w-2xl font-bold leading-tight"
        >
          Apoyo académico, diseño digital y documentos profesionales. Rápido, accesible y con excelente presentación.
        </motion.p>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <a
            href="#services"
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl text-center"
          >
            Ver Servicios
          </a>
          <a
            href="#status"
            className="px-10 py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-md text-center"
          >
            Rastrear Pedido
          </a>
        </motion.div>
      </div>

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full -z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>
    </section>
  );
}
