import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import OrderStatus from '@/components/OrderStatus';
import ContactForm from '@/components/ContactForm';
import { Users, ShieldCheck, Zap, Cpu } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      
      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] shadow-2xl flex items-center justify-center mb-8 text-white group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-slate-900 uppercase tracking-tighter">Confiabilidad</h3>
            <p className="text-slate-600 font-bold leading-relaxed">Trabajos blindados con garantía FOL PS. Entregas puntuales que aseguran tu éxito académico.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] shadow-2xl flex items-center justify-center mb-8 text-white group-hover:scale-110 transition-transform">
              <Zap className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-slate-900 uppercase tracking-tighter">Alto Rendimiento</h3>
            <p className="text-slate-600 font-bold leading-relaxed">Procesamos requerimientos con agilidad extrema. Calidad aplicada a cada detalle.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] shadow-xl flex items-center justify-center mb-8 text-slate-900 group-hover:scale-110 transition-transform border-2 border-slate-900">
              <Cpu className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-slate-900 uppercase tracking-tighter">Experticia Técnica</h3>
            <p className="text-slate-600 font-bold leading-relaxed">Mentes formadas en la UNI. Soluciones digitales escalables y optimizadas para el mundo real.</p>
          </div>
        </div>
      </section>

      <Services />
      <OrderStatus />

      {/* About Us Section */}
      <section id="about" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-black mb-8 italic tracking-tight leading-tight">
              &quot;Fundado para el éxito de todos.&quot;
            </h2>
            <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed font-bold">
              Somos Félix, Oscar y Leandro, estudiantes de Sistemas en la UNI. 
              FOL PS nació para ofrecer servicios digitales y académicos accesibles y profesionales. 
              Nuestra visión es convertirnos en una agencia digital y centro académico referente, 
              garantizando entregas limpias y atención rápida.
            </p>
            <div className="flex gap-12">
              <div className="text-center md:text-left">
                <p className="text-4xl md:text-6xl font-black text-blue-500 mb-1 tracking-tighter">100%</p>
                <p className="text-slate-500 uppercase tracking-widest text-[10px] font-black">Calidad</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-4xl md:text-6xl font-black text-white mb-1 tracking-tighter">UNI</p>
                <p className="text-slate-500 uppercase tracking-widest text-[10px] font-black">Formación</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-800 skew-x-12 translate-x-32 -z-0 hidden lg:block opacity-20"></div>
      </section>

      <ContactForm />

      <footer className="py-12 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 text-center">
          <p className="text-2xl font-bold text-slate-900 mb-4 tracking-tighter">FOL-Digital</p>
          <p className="text-slate-500 mb-8">© 2026 FOL-Digital. Managua, Nicaragua.</p>
          <div className="flex justify-center gap-6">
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Instagram</a>
            <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
