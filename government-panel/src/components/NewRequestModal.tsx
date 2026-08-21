import React, { useState } from 'react';
import { 
  Upload, 
  Sparkles,
  MapPin, 
  User, 
  Phone, 
  Mail,
  Building, 
  CheckSquare
} from 'lucide-react';
import type { CitizenRequest, Priority, Category, Ward } from '../types';
import { WARDS, PRESET_SAMPLE_PHOTOS } from '../data/mockRequests';
import { CustomButton } from './CustomButton';
import { retroAudio } from '../utils/retroAudio';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRequest: CitizenRequest) => void;
}

const CATEGORIES: Category[] = [
  'Roads & Infrastructure',
  'Water Supply & Drainage',
  'Sanitation & Waste',
  'Street Lighting & Power',
  'Public Safety & Hazards',
  'Parks & Public Amenities',
  'Other Civic Issues',
];

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [ward, setWard] = useState<Ward>(WARDS[0]);
  const [category, setCategory] = useState<Category>('Roads & Infrastructure');
  const [priority, setPriority] = useState<Priority>('high');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_SAMPLE_PHOTOS[0].url);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_SAMPLE_PHOTOS[0]) => {
    retroAudio.playClick();
    setImageUrl(preset.url);
    setCategory(preset.category);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!citizenName.trim()) newErrors.citizenName = 'Citizen name is required';
    if (!citizenPhone.trim()) newErrors.citizenPhone = 'Phone number is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!imageUrl.trim()) newErrors.imageUrl = 'Photo evidence is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const randomIdNumber = Math.floor(100 + Math.random() * 900);
    const trackingCode = `CIV-2026-${randomIdNumber}`;

    const newRequest: CitizenRequest = {
      id: `req-${Date.now()}`,
      trackingCode,
      citizenName: citizenName.trim(),
      citizenPhone: citizenPhone.trim(),
      citizenEmail: citizenEmail.trim() || undefined,
      location: location.trim(),
      ward,
      category,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      priority,
      status: 'pending',
      timestamp: new Date().toISOString(),
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'pending',
          actor: 'Citizen Intake Terminal',
          note: `Quest logged with ${priority.toUpperCase()} severity rank.`
        }
      ]
    };

    onSubmit(newRequest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="pixel-panel w-full max-w-3xl overflow-hidden my-6 border-4 border-black shadow-[8px_8px_0_#000]">
        
        {/* 8-Bit Window Header Bar */}
        <div className="pixel-window-header">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffe600]" />
            INTAKE TERMINAL // LOG NEW CITIZEN GRIEVANCE
          </span>
          <button
            onClick={() => {
              retroAudio.playClick();
              onClose();
            }}
            className="p-1 bg-[#ff0055] text-white border border-black font-pixel text-[9px] hover:bg-[#ff3355]"
          >
            [X]
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto bg-[#120c2e]">
          
          {/* Priority Tier Selection Bar */}
          <div>
            <label className="block font-pixel text-[9px] text-[#ffe600] uppercase tracking-wider mb-2">
              PRIORITY RANK (AFFECTS QUEUE POSITION) *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label
                onClick={() => retroAudio.playClick()}
                className={`cursor-pointer p-3 border-4 flex flex-col items-center text-center transition ${
                  priority === 'high'
                    ? 'border-[#ff0055] bg-[#2d0515] text-[#ff3355] shadow-[4px_4px_0_#ff0055]'
                    : 'border-black bg-[#08041a] text-slate-400 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="high"
                  checked={priority === 'high'}
                  onChange={() => setPriority('high')}
                  className="sr-only"
                />
                <span className="font-pixel text-xs text-[#ff3355] font-black">
                  ★ RANK S: HIGH
                </span>
                <span className="font-retro text-base text-slate-300 mt-1">Urgent / Top of Queue</span>
              </label>

              <label
                onClick={() => retroAudio.playClick()}
                className={`cursor-pointer p-3 border-4 flex flex-col items-center text-center transition ${
                  priority === 'medium'
                    ? 'border-[#ffe600] bg-[#2b2505] text-[#ffe600] shadow-[4px_4px_0_#ffe600]'
                    : 'border-black bg-[#08041a] text-slate-400 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="medium"
                  checked={priority === 'medium'}
                  onChange={() => setPriority('medium')}
                  className="sr-only"
                />
                <span className="font-pixel text-xs text-[#ffe600] font-bold">
                  ◆ RANK A: MED
                </span>
                <span className="font-retro text-base text-slate-300 mt-1">Standard Scheduling</span>
              </label>

              <label
                onClick={() => retroAudio.playClick()}
                className={`cursor-pointer p-3 border-4 flex flex-col items-center text-center transition ${
                  priority === 'low'
                    ? 'border-[#00f0ff] bg-[#05282d] text-[#00f0ff] shadow-[4px_4px_0_#00f0ff]'
                    : 'border-black bg-[#08041a] text-slate-400 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="low"
                  checked={priority === 'low'}
                  onChange={() => setPriority('low')}
                  className="sr-only"
                />
                <span className="font-pixel text-xs text-[#00f0ff] font-bold">
                  ● RANK B: LOW
                </span>
                <span className="font-retro text-base text-slate-300 mt-1">Routine Backlog</span>
              </label>
            </div>
          </div>

          {/* Citizen Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-pixel text-[9px] text-white mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#00f0ff]" />
                CITIZEN NAME *
              </label>
              <input
                type="text"
                placeholder="e.g. Rajesh Verma"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="pixel-input w-full"
              />
              {errors.citizenName && (
                <p className="font-retro text-base text-[#ff3355] mt-1 font-bold">{errors.citizenName}</p>
              )}
            </div>

            <div>
              <label className="block font-pixel text-[9px] text-white mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00ff88]" />
                CONTACT NUMBER *
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={citizenPhone}
                onChange={(e) => setCitizenPhone(e.target.value)}
                className="pixel-input w-full"
              />
              {errors.citizenPhone && (
                <p className="font-retro text-base text-[#ff3355] mt-1 font-bold">{errors.citizenPhone}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-pixel text-[9px] text-white mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#ffe600]" />
                EMAIL ADDRESS (OPTIONAL)
              </label>
              <input
                type="email"
                placeholder="e.g. citizen@example.com"
                value={citizenEmail}
                onChange={(e) => setCitizenEmail(e.target.value)}
                className="pixel-input w-full"
              />
            </div>
          </div>

          {/* Ward & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-pixel text-[9px] text-white mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#ffe600]" />
                WARD JURISDICTION *
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value as Ward)}
                className="pixel-input w-full cursor-pointer"
              >
                {WARDS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-pixel text-[9px] text-white mb-1.5">
                GRIEVANCE CATEGORY *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="pixel-input w-full cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Landmark */}
          <div>
            <label className="block font-pixel text-[9px] text-white mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#ff3355]" />
              LOCATION & LANDMARK *
            </label>
            <input
              type="text"
              placeholder="e.g. Sector 12 Market road, near ATM"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pixel-input w-full"
            />
            {errors.location && (
              <p className="font-retro text-base text-[#ff3355] mt-1 font-bold">{errors.location}</p>
            )}
          </div>

          {/* Problem Description */}
          <div>
            <label className="block font-pixel text-[9px] text-white mb-1.5">
              ISSUE DESCRIPTION *
            </label>
            <textarea
              rows={3}
              placeholder="Describe condition, safety hazards, urgency..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="pixel-input w-full"
            />
            {errors.description && (
              <p className="font-retro text-base text-[#ff3355] mt-1 font-bold">{errors.description}</p>
            )}
          </div>

          {/* Problem Photo Upload & Preset Selection */}
          <div className="space-y-3">
            <label className="block font-pixel text-[9px] text-[#ffe600] uppercase tracking-wider">
              PROBLEM PHOTO EVIDENCE *
            </label>

            {/* Quick 8-bit sample selector */}
            <div>
              <p className="font-retro text-lg text-slate-300 mb-1.5">Select a sample photo:</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_SAMPLE_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`relative overflow-hidden border-3 h-16 transition ${
                      imageUrl === preset.url ? 'border-[#ffe600] ring-2 ring-[#ffe600]' : 'border-black opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover pixel-art-image" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 font-pixel text-[7px] text-[#ffe600] text-center">
                      {preset.name.split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom file upload / URL option */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#08041a] p-3.5 border-3 border-black">
              <div className="w-24 h-24 overflow-hidden bg-black border-3 border-[#ffe600] shrink-0 shadow-[2px_2px_0_#000] flex items-center justify-center">
                <img src={imageUrl} alt="Problem Preview" className="w-full h-full object-cover pixel-art-image" />
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1f0a42] border-2 border-black font-pixel text-[8px] text-[#00f0ff] hover:bg-[#3b0f5e] cursor-pointer shadow-[2px_2px_0_#000]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>UPLOAD FILE</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste URL (https://...)"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="pixel-input flex-1 !text-base !py-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        retroAudio.playClick();
                        setImageUrl(customUrlInput.trim());
                        setCustomUrlInput('');
                      }
                    }}
                    className="px-3 py-1 bg-[#ffe600] text-black font-pixel text-[8px] border-2 border-black shadow-[2px_2px_0_#000] hover:bg-[#fffa65]"
                  >
                    APPLY
                  </button>
                </div>
              </div>
            </div>
            {errors.imageUrl && (
              <p className="font-retro text-base text-[#ff3355] mt-1 font-bold">{errors.imageUrl}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t-2 border-[#000000] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                retroAudio.playClick();
                onClose();
              }}
              className="px-4 py-2 font-pixel text-[9px] text-slate-400 hover:text-white"
            >
              CANCEL
            </button>

            <CustomButton
              type="submit"
              variant="gold"
              size="md"
              icon={<CheckSquare className="w-4 h-4 text-black" />}
            >
              REGISTER QUEST
            </CustomButton>
          </div>

        </form>
      </div>
    </div>
  );
};
