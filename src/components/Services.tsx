'use client';

import { motion } from 'framer-motion';
import { services } from '@/data/services';
import { CheckCircle2 } from 'lucide-react';

export default function Services() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section id="services" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Nuestros Servicios</h2>
          <div className="w-20 h-1.5 bg-slate-900 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {services.map((category, idx) => (
            <motion.div
              key={idx}
              className="bg-slate-50 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm font-mono">
                  0{idx + 1}
                </span>
                {category.category}
              </h3>
              
              <ul className="space-y-6">
                {category.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="group">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-slate-900 mt-1 shrink-0" />
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase text-sm">
                            {item.name}
                          </h4>
                          <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                            {item.price}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
