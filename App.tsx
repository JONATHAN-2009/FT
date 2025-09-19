
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SportSelector } from './components/SportSelector';
import { BriefingDisplay } from './components/BriefingDisplay';
import { Loader } from './components/Loader';
import { ErrorMessage } from './components/ErrorMessage';
import { generateSportsBriefing, generateBriefingImage } from './services/geminiService';
import { Briefing } from './types';
import { SPORTS_LIST } from './constants';

const App: React.FC = () => {
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSportSelectionChange = (sport: string) => {
    setSearchQuery(''); // Clear search if user interacts with sport selector
    setSelectedSports(prev =>
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };
  
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedSports([]); // Clear sport selection if user types in search
      setSearchQuery(e.target.value);
  };

  const generateBriefing = useCallback(async (sports: string[], query?: string) => {
    if (sports.length === 0 && (!query || query.trim() === '')) {
      setError("Please select sports or enter a search query.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setBriefing(null);

    try {
      setLoadingMessage("Analyzing the latest sports news...");
      const briefingResult = await generateSportsBriefing(sports, query);

      if (!briefingResult || !briefingResult.text) {
        throw new Error("Failed to generate a briefing. The AI model returned no content.");
      }
      
      setLoadingMessage("Creating a unique image for your briefing...");
      const imageUrl = await generateBriefingImage(briefingResult.text);

      setBriefing({ text: briefingResult.text, imageUrl, sources: briefingResult.sources });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleGenerateFromSports = () => {
    generateBriefing(selectedSports);
  };

  const handleGenerateFromSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      generateBriefing([], searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-8">
          
          <SportSelector
            sports={SPORTS_LIST}
            selectedSports={selectedSports}
            onSportChange={handleSportSelectionChange}
            onGenerate={handleGenerateFromSports}
            isGenerateDisabled={isLoading || selectedSports.length === 0}
          />

          <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-center text-teal-300">Or search for a specific event or topic</h2>
            <form onSubmit={handleGenerateFromSearch} className="flex items-center gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchQueryChange}
                disabled={isLoading}
                placeholder="e.g., 'UFC 303 results', 'Last night's NBA finals'..."
                className="flex-grow px-4 py-3 bg-gray-900 border-2 border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-colors"
                aria-label="Search for a specific sports event"
              />
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/40 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
              >
                Search
              </button>
            </form>
          </div>

          {isLoading && <Loader message={loadingMessage} />}
          {error && <ErrorMessage message={error} />}
          
          {!isLoading && briefing && (
            <div className="mt-8 w-full animate-fade-in">
              <BriefingDisplay briefing={briefing} />
            </div>
          )}

          {!isLoading && !briefing && !error && (
             <div className="text-center mt-12 p-8 bg-gray-800/50 rounded-lg">
                <h2 className="text-2xl font-bold text-teal-300">Welcome to Sportify!</h2>
                <p className="mt-2 text-gray-400">Select your favorite sports or search for a specific topic to get your personalized AI-powered sports report.</p>
             </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
