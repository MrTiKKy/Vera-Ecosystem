import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm, ValidationError } from '@formspree/react';

const SuggestionForm = () => {
  // 1. Înlocuiește "YOUR_FORM_ID" cu ID-ul tău de la Formspree
  const [state, handleSubmit] = useForm("xqedwwnw");

  if (state.succeeded) {
    return (
      <section className="w-full py-32 bg-transparent flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-10 bg-white/5 border border-[#2da1ad]/30 rounded-[2.5rem] backdrop-blur-md"
        >
          <h2 className="text-[#2da1ad] text-3xl font-black italic italic uppercase tracking-tighter">Success!</h2>
          <p className="text-white/60 mt-2">Data has been transmitted to the VERA ecosystem.</p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="w-full py-32 bg-transparent flex flex-col items-center">
      <div className="max-w-2xl w-full px-10">
        <div className="mb-12 text-center">
          <h2 className="text-white text-4xl font-black italic tracking-tighter uppercase">Drop a Suggestion</h2>
          <p className="text-white/40 text-sm mt-2 uppercase tracking-widest">Help us evolve the VERA ecosystem</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="relative">
            <input 
              id="email"
              type="email" 
              name="email"
              placeholder="YOUR@EMAIL.COM" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-mono text-sm focus:outline-none focus:border-[#2da1ad] transition-all"
              required
            />
            <ValidationError prefix="Email" field="email" errors={state.errors} />
          </div>

          <div className="relative">
            <textarea 
              id="message"
              name="message"
              placeholder="YOUR SUGGESTION OR FEEDBACK..." 
              rows="5"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-mono text-sm focus:outline-none focus:border-[#2da1ad] transition-all resize-none"
              required
            ></textarea>
            <ValidationError prefix="Message" field="message" errors={state.errors} />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={state.submitting}
            className="w-full bg-[#2da1ad] text-black font-black uppercase py-5 rounded-2xl tracking-[0.2em] hover:bg-[#3ec4d3] transition-colors disabled:opacity-50"
          >
            {state.submitting ? "Transmitting..." : "Transmit Data"}
          </motion.button>
        </form>
      </div>
    </section>
  );
};

export default SuggestionForm;