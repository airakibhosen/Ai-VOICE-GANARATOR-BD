/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Play, Square, Download, Loader2, Volume2, Mic2, FileText, Settings2, Trash2, ChevronDown, Check, User, UserCircle, Gauge, FastForward, RotateCcw, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const VOICES = [
  { id: 'Kore', name: 'Kore (Female)', description: 'Clear and professional', gender: 'Female' },
  { id: 'Puck', name: 'Puck (Male)', description: 'High energy and bright', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Male)', description: 'Deep and authoritative', gender: 'Male' },
  { id: 'Fenrir', name: 'Fenrir (Male)', description: 'Calm and intriguing', gender: 'Male' },
  { id: 'Zephyr', name: 'Zephyr (Male)', description: 'Gentle and smooth', gender: 'Male' },
];

const DEFAULT_SCRIPT = `আপনি কি জানেন পৃথিবীতে এমন একটি দেশ আছে যেখানে সাধারণ মানুষ ইন্টারনেট ব্যবহার করতে পারে না, এবং বিদেশি পর্যটক খুব কম ঢুকতে পারে? দেশটির নাম – North Korea। আজকের ভিডিওতে আমরা জানবো কেন North Korea পৃথিবীর সবচেয়ে রহস্যময় দেশ, এবং কেন এই দেশের ভিতরের খবর পৃথিবীর কাছে গোপন থাকে।

দ্বিতীয় বিশ্বযুদ্ধের পরে কোরিয়ার অঞ্চল দুই ভাগে ভাগ হয় – দক্ষিণ কোরিয়া এবং উত্তর কোরিয়া। উত্তর কোরিয়ায় সরকার সম্পূর্ণ নিয়ন্ত্রণ বজায় রেখেছে। এই দেশটি একটি একদম আলাদা রাজনৈতিক ও সামাজিক ব্যবস্থা তৈরি করেছে, যা পৃথিবীর বাকি দেশের সাথে মেলে না।

উত্তর কোরিয়ায় সাধারণ মানুষের জীবন অত্যন্ত নিয়ন্ত্রিত। তারা সীমিত ইন্টারনেট ব্যবহার করতে পারে, বিদেশি সংবাদ দেখা কঠিন, এবং সরকারের অনুমতি ছাড়া কিছু করতে পারে না। স্কুল, কর্মসংস্থান এবং বিনোদনের সব কিছু সরকার পর্যবেক্ষণ করে। এটা দেশের মানুষকে পৃথিবীর বাকি দুনিয়ার সাথে অনেকটাই বিচ্ছিন্ন করে।

North Korea বাইরের বিশ্বের সাথে খুব কম যোগাযোগ রাখে। এই কারণে দেশের ভিতরের অনেক তথ্য জানা যায় না। এটিই এটিকে পৃথিবীর সবচেয়ে রহস্যময় দেশগুলোর একটি বানিয়েছে। সরকারের কঠোর নিয়ন্ত্রণ এবং সীমিত তথ্য প্রবাহ একসাথে এই রহস্য তৈরি করেছে।

তাহলে, আপনি কী মনে করেন – North Korea কেন এত রহস্যময়? আপনার মতামত কমেন্টে লিখুন। এছাড়া ভিডিওটি লাইক ও শেয়ার করতে ভুলবেন না। সাবস্ক্রাইব করুন AI Rakib Documentary-কে, নতুন রহস্য উদঘাটনের জন্য।`;

export default function App() {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [pitch, setPitch] = useState(0.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'support' | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateVoiceover = async () => {
    if (!script.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Generate a professional documentary-style voiceover for the following script in its original language. Tone: engaging and clear. Speaking Rate: ${speakingRate}x. Pitch: ${pitch > 0 ? '+' : ''}${pitch}. Script: ${script}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        const binaryString = window.atob(base64Audio);
        const pcmData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pcmData[i] = binaryString.charCodeAt(i);
        }
        
        // Add WAV header (PCM, Mono, 24000Hz, 16-bit)
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        
        const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 32 + pcmData.length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, 24000, true); // Sample Rate
        view.setUint32(28, 48000, true); // Byte Rate (24000 * 1 * 2)
        view.setUint16(32, 2, true); // Block Align
        view.setUint16(34, 16, true); // Bits per Sample
        writeString(36, 'data');
        view.setUint32(40, pcmData.length, true);

        const blob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } else {
        throw new Error("No audio data received from the model.");
      }
    } catch (err) {
      console.error("Error generating voiceover:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voiceover-${selectedVoice.toLowerCase()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-serif p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1A1A1A]/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#5A5A40] mb-2 font-sans font-semibold">
              <Mic2 size={14} />
              AI VOICE GANARATOR BD
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
              VOICEOVER <span className="italic font-light">STUDIO</span>
            </h1>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-sans text-[#5A5A40] uppercase tracking-tighter">Powered by Gemini 2.5 TTS</p>
            <p className="text-xs font-sans opacity-50">v1.0.4 • Production Grade</p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Script Input */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1A1A1A]/5">
              <div className="flex items-center justify-between mb-4 text-[#5A5A40]">
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  <h2 className="text-sm font-sans font-bold uppercase tracking-wider">Past Script</h2>
                </div>
                <button 
                  onClick={() => setScript('')}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold hover:text-red-600 transition-colors"
                  title="Clear Script"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Enter your script here..."
                className="w-full h-[400px] bg-transparent border-none focus:ring-0 text-lg leading-relaxed resize-none font-serif placeholder:italic"
              />
              <div className="mt-4 flex justify-between items-center text-xs font-sans text-[#5A5A40]/60">
                <span>{script.length} characters</span>
                <span>Auto-detect Language</span>
              </div>
            </div>
          </div>

          {/* Right Column: Controls & Output */}
          <div className="lg:col-span-4 space-y-6">
            {/* Voice Selection */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1A1A1A]/5 relative">
              <div className="flex items-center justify-between mb-4 text-[#5A5A40]">
                <div className="flex items-center gap-2">
                  <Settings2 size={18} />
                  <h2 className="text-sm font-sans font-bold uppercase tracking-wider">Voice Settings</h2>
                </div>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-[#1A1A1A]/10 bg-[#F5F5F0]/30 hover:bg-[#F5F5F0]/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      VOICES.find(v => v.id === selectedVoice)?.gender === 'Female' ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
                    )}>
                      <UserCircle size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-sans font-bold text-sm leading-tight">
                        {VOICES.find(v => v.id === selectedVoice)?.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5A40]/60">
                        {VOICES.find(v => v.id === selectedVoice)?.gender} • {VOICES.find(v => v.id === selectedVoice)?.description}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={cn("text-[#5A5A40]/40 transition-transform duration-300", isVoiceMenuOpen && "rotate-180")} size={20} />
                </button>

                {isVoiceMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsVoiceMenuOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#1A1A1A]/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                      <div className="p-2 max-h-[300px] overflow-y-auto">
                        {VOICES.map((voice) => (
                          <button
                            key={voice.id}
                            onClick={() => {
                              setSelectedVoice(voice.id);
                              setIsVoiceMenuOpen(false);
                            }}
                            className={cn(
                              "w-full text-left p-3 rounded-xl transition-all duration-150 flex items-center justify-between group",
                              selectedVoice === voice.id
                                ? "bg-[#5A5A40] text-white"
                                : "hover:bg-[#F5F5F0]"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                selectedVoice === voice.id 
                                  ? "bg-white/20 text-white" 
                                  : voice.gender === 'Female' ? "bg-pink-50 text-pink-500" : "bg-blue-50 text-blue-500"
                              )}>
                                <User size={16} />
                              </div>
                              <div>
                                <div className="font-sans font-bold text-sm">{voice.name}</div>
                                <div className={cn(
                                  "text-[10px] uppercase tracking-wider",
                                  selectedVoice === voice.id ? "text-white/60" : "text-[#5A5A40]/60"
                                )}>
                                  {voice.gender} • {voice.description}
                                </div>
                              </div>
                            </div>
                            {selectedVoice === voice.id && <Check size={16} className="text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Pitch & Rate Controls */}
              <div className="mt-8 space-y-6 pt-6 border-t border-[#1A1A1A]/5">
                {/* Speaking Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#5A5A40]">
                      <FastForward size={14} />
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Speaking Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#5A5A40]">{speakingRate.toFixed(2)}x</span>
                      <button 
                        onClick={() => setSpeakingRate(1.0)}
                        className="p-1 hover:bg-[#F5F5F0] rounded-md transition-colors text-[#5A5A40]/40 hover:text-[#5A5A40]"
                        title="Reset Rate"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="4.0"
                    step="0.05"
                    value={speakingRate}
                    onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#F5F5F0] rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
                  />
                  <div className="flex justify-between text-[8px] uppercase tracking-tighter text-[#5A5A40]/40 font-bold">
                    <span>Slower</span>
                    <span>Normal</span>
                    <span>Faster</span>
                  </div>
                </div>

                {/* Pitch */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#5A5A40]">
                      <Gauge size={14} />
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider">Voice Pitch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#5A5A40]">{pitch > 0 ? '+' : ''}{pitch.toFixed(1)}</span>
                      <button 
                        onClick={() => setPitch(0.0)}
                        className="p-1 hover:bg-[#F5F5F0] rounded-md transition-colors text-[#5A5A40]/40 hover:text-[#5A5A40]"
                        title="Reset Pitch"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-20.0"
                    max="20.0"
                    step="0.5"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#F5F5F0] rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
                  />
                  <div className="flex justify-between text-[8px] uppercase tracking-tighter text-[#5A5A40]/40 font-bold">
                    <span>Lower</span>
                    <span>Neutral</span>
                    <span>Higher</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={generateVoiceover}
              disabled={isGenerating || !script.trim()}
              className={cn(
                "w-full py-6 rounded-full font-sans font-black text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg",
                isGenerating 
                  ? "bg-[#1A1A1A]/10 text-[#1A1A1A]/40 cursor-not-allowed" 
                  : "bg-[#5A5A40] text-white hover:bg-[#4A4A30] active:scale-95"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 />
                  Generate Audio
                </>
              )}
            </button>

            {/* Output Player */}
            {audioUrl && (
              <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4 text-white/60">
                  <Play size={18} />
                  <h2 className="text-sm font-sans font-bold uppercase tracking-wider">Preview Output</h2>
                </div>
                
                <audio ref={audioRef} src={audioUrl} className="hidden" onEnded={() => {}} />
                
                <div className="flex flex-col gap-4">
                  <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => audioRef.current?.play()}
                        className="w-10 h-10 bg-white text-[#1A1A1A] rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Play size={20} fill="currentColor" />
                      </button>
                      <div>
                        <div className="text-xs font-sans font-bold uppercase tracking-wider">Voice: {selectedVoice}</div>
                        <div className="text-[10px] opacity-50 font-sans">Ready to download</div>
                      </div>
                    </div>
                    <button 
                      onClick={downloadAudio}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Download WAV"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-sans">
                <p className="font-bold mb-1">Generation Failed</p>
                <p className="opacity-80">{error}</p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="pt-12 border-t border-[#1A1A1A]/10 flex flex-col md:flex-row justify-between gap-4 items-center">
          <p className="text-xs font-sans text-[#5A5A40]/60 uppercase tracking-widest">
            © 2026 AI VOICE GANARATOR BD • All Rights Reserved
          </p>
          <div className="flex gap-6 text-[10px] font-sans font-bold uppercase tracking-widest text-[#5A5A40]">
            <button onClick={() => setActiveModal('privacy')} className="hover:text-[#1A1A1A] transition-colors">Privacy</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-[#1A1A1A] transition-colors">Terms</button>
            <button onClick={() => setActiveModal('support')} className="hover:text-[#1A1A1A] transition-colors">Support</button>
          </div>
        </footer>

        {/* Modals */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
              className="absolute inset-0" 
              onClick={() => setActiveModal(null)}
            />
            <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              <div className="p-6 border-b border-[#1A1A1A]/5 flex items-center justify-between bg-[#F5F5F0]/30">
                <h3 className="font-sans font-bold text-lg uppercase tracking-wider text-[#5A5A40]">
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'terms' && 'Terms of Service'}
                  {activeModal === 'support' && 'Support'}
                </h3>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors text-[#5A5A40]"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto font-sans text-[#1A1A1A]/80 leading-relaxed space-y-4">
                {activeModal === 'privacy' && (
                  <>
                    <p className="font-bold text-[#5A5A40]">Your privacy is important to us.</p>
                    <p>We do not store your scripts or generated audio files on our servers. All processing is done in real-time using the Gemini API.</p>
                    <p>We do not collect personal information unless you explicitly provide it for support purposes.</p>
                    <p>Cookies are used only for essential session management and to improve your user experience.</p>
                  </>
                )}
                {activeModal === 'terms' && (
                  <>
                    <p className="font-bold text-[#5A5A40]">Terms of Service</p>
                    <p>By using AI VOICE GENERATOR BD, you agree to use the generated content responsibly and in accordance with local laws.</p>
                    <p>You are responsible for the scripts you provide and the resulting audio content.</p>
                    <p>We are not liable for any misuse of the generated voices or any inaccuracies in the text-to-speech output.</p>
                  </>
                )}
                {activeModal === 'support' && (
                  <>
                    <p className="font-bold text-[#5A5A40]">Need Help?</p>
                    <p>If you encounter any issues or have suggestions, please feel free to reach out to us.</p>
                    <div className="bg-[#F5F5F0] p-4 rounded-2xl border border-[#1A1A1A]/5">
                      <p className="text-sm font-bold mb-1">Email Support:</p>
                      <p className="text-[#5A5A40]">support@aivoicebd.com</p>
                    </div>
                    <p>Our team typically responds within 24-48 hours.</p>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-[#1A1A1A]/5 flex justify-end">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-2 bg-[#5A5A40] text-white rounded-xl font-bold text-sm hover:bg-[#4A4A30] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
