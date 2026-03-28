import React from "react";
import { motion } from "framer-motion";

const Hero = ({ onGetStarted, wallet }) => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-20">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)",
        }}
      />

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl z-10 relative"
      >
        <h1 className="text-8xl md:text-8xl lg:text-8xl font-extrabold tracking-tight text-white mb-8 leading-[0.9]">
          PROTECT
          <br />
          <motion.span
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-green-200 to-yellow-200 bg-[length:200%_auto]"
          >
            YOUR ASSETS
          </motion.span>
        </h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed font-light tracking-wide mb-12"
        >
          DeFi Insurance Protocol with Proportional Payouts. Buy coverage, stay
          protected against rug pulls and sudden liquidity drops.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto mb-12"
        >
          <div className="bg-white/10 backdrop-blur border border-white/20 p-4 md:p-6">
            <div className="text-2xl md:text-3xl font-bold text-white font-mono">
              1.6
            </div>
            <div className="text-xs text-white/80 font-mono mt-2">
              MON AVG PAYOUT
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 p-4 md:p-6">
            <div className="text-2xl md:text-3xl font-bold text-white font-mono">
              95%
            </div>
            <div className="text-xs text-white/80 font-mono mt-2">
              DROP DETECTION
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 p-4 md:p-6">
            <div className="text-2xl md:text-3xl font-bold text-white font-mono">
              10%
            </div>
            <div className="text-xs text-white/80 font-mono mt-2">
              PREMIUM RATE
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-green-700 text-white font-bold font-mono rounded-none border-3 border-white hover:bg-green-800 transition-all uppercase tracking-wider text-sm"
          >
            {wallet ? "OPEN APP" : "CONNECT WALLET"}
          </button>
          <button className="px-8 py-4 bg-transparent border-3 border-white text-white font-bold font-mono rounded-none hover:bg-white/10 transition-all uppercase tracking-wider text-sm">
            LEARN MORE
          </button>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
      >
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
      </motion.div>
    </section>
  );
};

export default Hero;
