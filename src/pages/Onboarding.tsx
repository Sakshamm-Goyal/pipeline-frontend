import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const TOTAL_STEPS = 8;

// Map frontend values to backend enum values
const genderMap: Record<string, string> = {
  'Woman': 'female',
  'Man': 'male',
  'Non-binary': 'non-binary',
  'Prefer not to say': 'prefer-not-to-say',
};

const GOALS = [
  { id: 'build-closet', label: 'Build My Closet', emoji: '👗', desc: 'Organize and expand your wardrobe' },
  { id: 'find-style', label: 'Find My Style', emoji: '✨', desc: 'Discover what looks best on you' },
  { id: 'shop-smart', label: 'Shop Smarter', emoji: '🛍️', desc: 'Get personalized recommendations' },
  { id: 'special-event', label: 'Special Event', emoji: '🎉', desc: 'Find the perfect outfit for an occasion' },
];

const STYLES = [
  { id: 'casual', label: 'Casual', emoji: '👕' },
  { id: 'business-casual', label: 'Business Casual', emoji: '👔' },
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'sporty', label: 'Sporty', emoji: '🏃' },
  { id: 'bohemian', label: 'Bohemian', emoji: '🌸' },
  { id: 'elegant', label: 'Elegant', emoji: '👠' },
  { id: 'minimalist', label: 'Minimalist', emoji: '◻️' },
  { id: 'streetwear', label: 'Streetwear', emoji: '🧢' },
  { id: 'vintage', label: 'Vintage', emoji: '📻' },
  { id: 'romantic', label: 'Romantic', emoji: '💕' },
];

const COLORS = [
  { id: 'black', hex: '#000000', label: 'Black' },
  { id: 'white', hex: '#FFFFFF', label: 'White' },
  { id: 'navy', hex: '#1a237e', label: 'Navy' },
  { id: 'gray', hex: '#757575', label: 'Gray' },
  { id: 'beige', hex: '#d7ccc8', label: 'Beige' },
  { id: 'brown', hex: '#795548', label: 'Brown' },
  { id: 'red', hex: '#c62828', label: 'Red' },
  { id: 'pink', hex: '#ec407a', label: 'Pink' },
  { id: 'blue', hex: '#1e88e5', label: 'Blue' },
  { id: 'green', hex: '#43a047', label: 'Green' },
  { id: 'purple', hex: '#7b1fa2', label: 'Purple' },
  { id: 'yellow', hex: '#fdd835', label: 'Yellow' },
];

const OCCASIONS = [
  { id: 'work', label: 'Work/Office', emoji: '💼' },
  { id: 'casual', label: 'Casual/Weekend', emoji: '☕' },
  { id: 'date', label: 'Date Night', emoji: '💕' },
  { id: 'party', label: 'Party/Night Out', emoji: '🎉' },
  { id: 'formal', label: 'Formal Events', emoji: '🎩' },
  { id: 'workout', label: 'Workout/Active', emoji: '🏃' },
];

// MVP Priority Brands - these retailers are prioritized for our initial launch
const MVP_BRANDS = [
  { id: 'amazon', label: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com' },
  { id: 'walmart', label: 'Walmart', logo: 'https://logo.clearbit.com/walmart.com' },
  { id: 'hm', label: 'H&M', logo: 'https://logo.clearbit.com/hm.com' },
  { id: 'zara', label: 'Zara', logo: 'https://logo.clearbit.com/zara.com' },
  { id: 'asos', label: 'ASOS', logo: 'https://logo.clearbit.com/asos.com' },
  { id: 'macys', label: "Macy's", logo: 'https://logo.clearbit.com/macys.com' },
  { id: 'nike', label: 'Nike', logo: 'https://logo.clearbit.com/nike.com' },
  { id: 'dsw', label: 'DSW', logo: 'https://logo.clearbit.com/dsw.com' },
  { id: 'shein', label: 'Shein', logo: 'https://logo.clearbit.com/shein.com' },
  { id: 'gap', label: 'Gap', logo: 'https://logo.clearbit.com/gap.com' },
  { id: 'target', label: 'Target', logo: 'https://logo.clearbit.com/target.com' },
  { id: 'nordstrom', label: 'Nordstrom', logo: 'https://logo.clearbit.com/nordstrom.com' },
  { id: 'uniqlo', label: 'Uniqlo', logo: 'https://logo.clearbit.com/uniqlo.com' },
  { id: 'adidas', label: 'Adidas', logo: 'https://logo.clearbit.com/adidas.com' },
];

const BODY_TYPES = [
  { id: 'athletic', label: 'Athletic', desc: 'Defined muscles, broad shoulders' },
  { id: 'pear', label: 'Pear', desc: 'Wider hips than shoulders' },
  { id: 'apple', label: 'Apple', desc: 'Fuller midsection' },
  { id: 'hourglass', label: 'Hourglass', desc: 'Balanced shoulders and hips' },
  { id: 'rectangle', label: 'Rectangle', desc: 'Similar measurements throughout' },
  { id: 'inverted-triangle', label: 'Inverted Triangle', desc: 'Broader shoulders' },
];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gender: '',
    goal: '',
    primaryStyle: '',
    selectedStyles: [] as string[],
    colorPreferences: [] as string[],
    avoidColors: [] as string[],
    bodyType: '',
    budget: { min: 50, max: 500 },
    occasionPreferences: [] as string[],
    sustainabilityPreference: false,
    likedBrands: [] as string[],
    dislikedBrands: [] as string[],
  });
  const navigate = useNavigate();
  const { updateProfile } = useAuthStore();

  const toggleArrayItem = (field: 'selectedStyles' | 'colorPreferences' | 'avoidColors' | 'occasionPreferences' | 'likedBrands' | 'dislikedBrands', item: string) => {
    setFormData((prev) => {
      const current = prev[field];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter((i) => i !== item) };
      }
      return { ...prev, [field]: [...current, item] };
    });
  };

  // Map goal IDs to backend enum values
  const goalMap: Record<string, string> = {
    'build-closet': 'build-closet',
    'find-style': 'build-closet', // Map to closest backend value
    'shop-smart': 'shop-mindfully',
    'special-event': 'utilize-wardrobe',
  };

  // Map style IDs to backend StyleTag enum values
  const styleTagMap: Record<string, string> = {
    'casual': 'casual',
    'business-casual': 'professional',
    'professional': 'formal',
    'sporty': 'sporty',
    'bohemian': 'bohemian',
    'elegant': 'elegant',
    'minimalist': 'minimal',
    'streetwear': 'street',
    'vintage': 'vintage',
    'romantic': 'romantic',
  };

  // Map color IDs to hex codes for backend
  const colorHexMap: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'navy': '#1a237e',
    'gray': '#757575',
    'beige': '#d7ccc8',
    'brown': '#795548',
    'red': '#c62828',
    'pink': '#ec407a',
    'blue': '#1e88e5',
    'green': '#43a047',
    'purple': '#7b1fa2',
    'yellow': '#fdd835',
  };

  // Map body type IDs to backend enum values (used in profile update)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const bodyTypeMap: Record<string, string> = {
    'athletic': 'athletic',
    'pear': 'pear',
    'apple': 'apple',
    'hourglass': 'hourglass',
    'rectangle': 'rectangle',
    'inverted-triangle': 'inverted-triangle',
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Step 1: Gender and Goal
      await onboardingAPI.saveStep1({
        gender: genderMap[formData.gender] || 'prefer-not-to-say',
        goal: goalMap[formData.goal] || 'build-closet',
      });

      // Step 2: Body Analysis (optional - only if body type selected)
      if (formData.bodyType) {
        try {
          await onboardingAPI.saveStep3({
            // Using step3 for fit preferences as step2 requires image upload
          });
        } catch (e) {
          // Step 2/3 are optional, continue if they fail
        }
      }

      // Step 4: Style Preferences (with colors)
      const mappedStyles = formData.selectedStyles
        .map(s => styleTagMap[s] || s)
        .filter(Boolean);

      await onboardingAPI.saveStep4({
        selectedStyles: mappedStyles.length > 0 ? mappedStyles : ['casual'],
        primaryStyle: styleTagMap[formData.primaryStyle] || mappedStyles[0] || 'casual',
        colorPreferences: formData.colorPreferences.map(c => colorHexMap[c] || c),
        avoidColors: formData.avoidColors.map(c => colorHexMap[c] || c),
      });

      // Step 5: Brand Preferences (with budget and liked/disliked brands)
      await onboardingAPI.saveStep5({
        likedBrands: formData.likedBrands,
        dislikedBrands: formData.dislikedBrands,
        priceRange: {
          min: formData.budget.min,
          max: formData.budget.max,
          currency: 'USD',
        },
      });

      // Step 9: Consent
      await onboardingAPI.saveStep9({
        consentGiven: true,
        allowDataSharing: false,
        allowAITraining: false,
      });

      // Update local state for immediate use
      updateProfile({
        gender: genderMap[formData.gender],
        primaryStyle: formData.primaryStyle,
        selectedStyles: formData.selectedStyles,
        colorPreferences: formData.colorPreferences,
        avoidColors: formData.avoidColors,
        bodyType: formData.bodyType,
        budgetMin: formData.budget.min,
        budgetMax: formData.budget.max,
        occasionPreferences: formData.occasionPreferences,
        sustainabilityPreference: formData.sustainabilityPreference,
        likedBrands: formData.likedBrands,
        dislikedBrands: formData.dislikedBrands,
        onboardingComplete: true,
      });

      navigate('/chat');
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!formData.gender;
      case 2: return !!formData.goal;
      case 3: return formData.selectedStyles.length > 0;
      case 4: return formData.colorPreferences.length > 0;
      case 5: return true; // Body type is optional
      case 6: return true; // Budget has defaults
      case 7: return true; // Brand preferences are optional but encouraged
      case 8: return formData.occasionPreferences.length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto py-16 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">E</span>
          </div>
          <p className="text-sm text-gray-500">Step {step} of {TOTAL_STEPS}</p>
        </div>

        {/* Step 1: Gender */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Welcome to Elara!</h1>
            <p className="text-center text-gray-600 mb-8">Let's personalize your fashion experience</p>

            <h2 className="text-xl font-semibold mb-4 text-gray-800">How do you identify?</h2>
            <div className="grid grid-cols-2 gap-4">
              {['Woman', 'Man', 'Non-binary', 'Prefer not to say'].map((g) => (
                <button
                  key={g}
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.gender === g
                      ? 'border-purple-500 bg-purple-50 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <span className="text-lg font-medium">{g}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">What brings you here?</h1>
            <p className="text-center text-gray-600 mb-8">This helps us tailor your experience</p>

            <div className="grid grid-cols-1 gap-4">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setFormData({ ...formData, goal: goal.id })}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    formData.goal === goal.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{goal.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{goal.label}</p>
                      <p className="text-sm text-gray-500">{goal.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Style Preferences */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">What's your style?</h1>
            <p className="text-center text-gray-600 mb-8">Select all that resonate with you</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STYLES.map((style) => {
                const isSelected = formData.selectedStyles.includes(style.id);
                return (
                  <button
                    key={style.id}
                    onClick={() => toggleArrayItem('selectedStyles', style.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{style.emoji}</span>
                    <span className="text-sm font-medium">{style.label}</span>
                  </button>
                );
              })}
            </div>

            {formData.selectedStyles.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which is your primary style?
                </label>
                <select
                  value={formData.primaryStyle}
                  onChange={(e) => setFormData({ ...formData, primaryStyle: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select your primary style</option>
                  {formData.selectedStyles.map((styleId) => {
                    const style = STYLES.find((s) => s.id === styleId);
                    return (
                      <option key={styleId} value={styleId}>
                        {style?.label || styleId}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Colors */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Color Preferences</h1>
            <p className="text-center text-gray-600 mb-8">What colors make you feel confident?</p>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors you love</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {COLORS.map((color) => {
                  const isSelected = formData.colorPreferences.includes(color.id);
                  return (
                    <button
                      key={color.id}
                      onClick={() => toggleArrayItem('colorPreferences', color.id)}
                      className={`w-14 h-14 rounded-full border-4 transition-all ${
                        isSelected
                          ? 'border-purple-500 scale-110 shadow-lg'
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors to avoid (optional)</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {COLORS.map((color) => {
                  const isSelected = formData.avoidColors.includes(color.id);
                  const isLoved = formData.colorPreferences.includes(color.id);
                  return (
                    <button
                      key={color.id}
                      onClick={() => !isLoved && toggleArrayItem('avoidColors', color.id)}
                      disabled={isLoved}
                      className={`w-10 h-10 rounded-full border-3 transition-all ${
                        isSelected
                          ? 'border-red-500 opacity-50'
                          : isLoved
                          ? 'opacity-20 cursor-not-allowed'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Body Type */}
        {step === 5 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Body Type</h1>
            <p className="text-center text-gray-600 mb-8">This helps us suggest flattering fits (optional)</p>

            <div className="grid grid-cols-2 gap-4">
              {BODY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, bodyType: type.id })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.bodyType === type.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setFormData({ ...formData, bodyType: '' })}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Skip this step
            </button>
          </div>
        )}

        {/* Step 6: Budget */}
        {step === 6 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Budget Range</h1>
            <p className="text-center text-gray-600 mb-8">What's your typical spending per item?</p>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-purple-600">
                  ${formData.budget.min} - ${formData.budget.max}
                </span>
                <p className="text-sm text-gray-500 mt-1">per item</p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Minimum</span>
                    <span>${formData.budget.min}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={formData.budget.min}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({
                        ...formData,
                        budget: {
                          ...formData.budget,
                          min: val,
                          max: Math.max(val, formData.budget.max),
                        },
                      });
                    }}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Maximum</span>
                    <span>${formData.budget.max}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={formData.budget.max}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({
                        ...formData,
                        budget: {
                          ...formData.budget,
                          max: val,
                          min: Math.min(val, formData.budget.min),
                        },
                      });
                    }}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Brand Preferences */}
        {step === 7 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Favorite Retailers</h1>
            <p className="text-center text-gray-600 mb-8">Select brands you love shopping from</p>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Brands you love</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {MVP_BRANDS.map((brand) => {
                  const isSelected = formData.likedBrands.includes(brand.id);
                  const isDisliked = formData.dislikedBrands.includes(brand.id);
                  return (
                    <button
                      key={brand.id}
                      onClick={() => {
                        if (isDisliked) return;
                        toggleArrayItem('likedBrands', brand.id);
                      }}
                      disabled={isDisliked}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : isDisliked
                          ? 'opacity-30 cursor-not-allowed'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <img
                        src={brand.logo}
                        alt={brand.label}
                        className="w-10 h-10 object-contain mb-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${brand.label}&background=random`;
                        }}
                      />
                      <span className="text-xs font-medium text-center">{brand.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Brands to avoid (optional)</h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {MVP_BRANDS.map((brand) => {
                  const isSelected = formData.dislikedBrands.includes(brand.id);
                  const isLiked = formData.likedBrands.includes(brand.id);
                  return (
                    <button
                      key={brand.id}
                      onClick={() => {
                        if (isLiked) return;
                        toggleArrayItem('dislikedBrands', brand.id);
                      }}
                      disabled={isLiked}
                      className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center ${
                        isSelected
                          ? 'border-red-500 bg-red-50 opacity-60'
                          : isLiked
                          ? 'opacity-20 cursor-not-allowed'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <img
                        src={brand.logo}
                        alt={brand.label}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${brand.label}&background=random&size=32`;
                        }}
                      />
                      <span className="text-[10px] font-medium text-center mt-0.5">{brand.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.likedBrands.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <p className="text-sm text-purple-800">
                  <span className="font-semibold">Selected: </span>
                  {formData.likedBrands.map(id => MVP_BRANDS.find(b => b.id === id)?.label).join(', ')}
                </p>
              </div>
            )}

            <button
              onClick={() => setFormData({ ...formData, likedBrands: [], dislikedBrands: [] })}
              className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Skip this step
            </button>
          </div>
        )}

        {/* Step 8: Occasions & Sustainability */}
        {step === 8 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Almost Done!</h1>
            <p className="text-center text-gray-600 mb-8">A few more preferences to personalize your experience</p>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">What occasions do you shop for?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {OCCASIONS.map((occ) => {
                  const isSelected = formData.occasionPreferences.includes(occ.id);
                  return (
                    <button
                      key={occ.id}
                      onClick={() => toggleArrayItem('occasionPreferences', occ.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-xl">{occ.emoji}</span>
                      <span className="text-sm font-medium block mt-1">{occ.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <p className="font-semibold text-gray-900">Sustainability Focus</p>
                    <p className="text-sm text-gray-600">Prioritize eco-friendly brands</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setFormData({ ...formData, sustainabilityPreference: !formData.sustainabilityPreference })
                  }
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    formData.sustainabilityPreference ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      formData.sustainabilityPreference ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (step === TOTAL_STEPS ? handleComplete() : setStep(step + 1))}
            disabled={!canProceed() || loading}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
              step === TOTAL_STEPS
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Setting up...
              </span>
            ) : step === TOTAL_STEPS ? (
              "Let's Go!"
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
