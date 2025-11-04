import Spline from '@splinetool/react-spline';
import { motion } from 'framer-motion';

export default function HeroCover() {
  const scrollToGame = () => {
    const el = document.getElementById('game');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative w-full h-[70vh] overflow-hidden">
      <div className="absolute inset-0">
        <Spline 
          scene="https://prod.spline.design/atN3lqky4IzF-KEP/scene.splinecode" 
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90" />

      <div className="relative z-10 flex h-full items-center justify-center text-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            Enchanted Solitaire
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            A magical, happy twist on classic Solitaire. Every move sparkles with wonder.
          </p>
          <div className="mt-8 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={scrollToGame}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-6 py-3 text-white font-semibold shadow-lg shadow-fuchsia-500/30 ring-2 ring-white/30"
            >
              Start Playing
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
