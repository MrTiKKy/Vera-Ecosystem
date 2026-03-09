import React from 'react';
import Hero from '../components/Hero';
import FeaturesGrid from '../components/FeaturesGrid';
import ScrollReveal from '../components/Scrollreveal';
import SuggestionForm from '../components/SuggestionForm';

const Home = () => {
  return (
    <div className="w-full">
      {/* Secțiunea cu Creierul de sticlă */}
      <Hero />
      
      {/* Bento Grid-ul cu funcții */}
      <div className="max-w-7xl mx-auto px-6">
        <FeaturesGrid />
      </div>

      {/* Formularul de sugestii */}
      <div className="max-w-7xl mx-auto px-6">
        <SuggestionForm />
      </div>
    </div>
  );
};

export default Home;