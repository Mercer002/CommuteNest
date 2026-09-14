import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Bath,
  Bed,
  Bike,
  Bus,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Dog,
  DollarSign,
  Dumbbell,
  ExternalLink,
  Flame,
  Footprints,
  Home,
  Mail,
  MapPin,
  Maximize2,
  RefreshCw,
  Save,
  Shirt,
  SlidersHorizontal,
  Sofa,
  Sparkles,
  Sun,
  TrendingDown,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import {
  fetchHealth,
  fetchUserPreferences,
  saveUserPreferences,
  sendDealsEmail,
  triggerScan,
} from "./api.js";
import type { MatchedListing, TransitMode, UserPreferences } from "./types.js";

const PRESET_DESTINATIONS = [
  "Union Station, Toronto, ON",
  "Financial District, Toronto, ON",
  "Yonge & Bloor, Toronto, ON",
  "U of T St. George, Toronto, ON",
  "High Park, Toronto, ON",
  "North York Centre, Toronto, ON",
  "Mississauga City Centre, ON",
];

function getInitialUserId(): string {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get("user") || urlParams.get("u");
    if (param && /^[a-zA-Z0-9_-]{1,64}$/.test(param)) {
      return param;
    }
    const saved = localStorage.getItem("commutenest_user_id");
    if (saved && /^[a-zA-Z0-9_-]{1,64}$/.test(saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return "mercer";
}

export function App() {
  const [userId, setUserId] = useState(() => getInitialUserId());
  const [activeUserId, setActiveUserId] = useState(() => getInitialUserId());

  // Core preferences
  const [maxRentUsd, setMaxRentUsd] = useState(1750);
  const [maxCommuteMinutes, setMaxCommuteMinutes] = useState(30);
  const [targetDestination, setTargetDestination] = useState("Union Station, Toronto, ON");
  const [transitMode, setTransitMode] = useState<TransitMode>("transit");
  const [transitModes, setTransitModes] = useState<string[]>(["bus", "subway", "train"]);
  const [selectedTransitModes, setSelectedTransitModes] = useState<TransitMode[]>(["transit"]);
  const [notificationEmail, setNotificationEmail] = useState("mercer586@outlook.com");

  // Optional Marketplace filters
  const [showMarketplaceFilters, setShowMarketplaceFilters] = useState(false);
  const [minBedrooms, setMinBedrooms] = useState<number | undefined>(undefined);
  const [maxBedrooms, setMaxBedrooms] = useState<number | undefined>(undefined);
  const [minBathrooms, setMinBathrooms] = useState<number | undefined>(undefined);
  const [minSquareFeet, setMinSquareFeet] = useState<number | undefined>(undefined);
  const [maxSquareFeet, setMaxSquareFeet] = useState<number | undefined>(undefined);

  // Amenities
  const [hasGym, setHasGym] = useState(false);
  const [hasPool, setHasPool] = useState(false);
  const [hasLaundry, setHasLaundry] = useState(false);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [airConditioning, setAirConditioning] = useState(false);
  const [hasBalcony, setHasBalcony] = useState(false);

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [backendHealth, setBackendHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedRecord, setLastSavedRecord] = useState<UserPreferences | null>(null);
  const [matchedListings, setMatchedListings] = useState<MatchedListing[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [isEmailingDeals, setIsEmailingDeals] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);

  // Health check on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Load preferences when activeUserId changes
  useEffect(() => {
    loadPreferences(activeUserId);
    try {
      localStorage.setItem("commutenest_user_id", activeUserId);
      const url = new URL(window.location.href);
      url.searchParams.set("user", activeUserId);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // ignore
    }
  }, [activeUserId]);

  async function checkBackendHealth() {
    try {
      setHealthError(null);
      const health = await fetchHealth();
      setBackendHealth(health);
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : "Unable to reach API");
    }
  }

  function getActiveFilterParams() {
    return {
      maxRentUsd,
      maxCommuteMinutes,
      targetDestination,
      transitMode,
      transitModes,
      selectedTransitModes,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      minSquareFeet,
      maxSquareFeet,
      hasGym: hasGym || undefined,
      hasPool: hasPool || undefined,
      hasLaundry: hasLaundry || undefined,
      utilitiesIncluded: utilitiesIncluded || undefined,
      hasParking: hasParking || undefined,
      petFriendly: petFriendly || undefined,
      furnished: furnished || undefined,
      airConditioning: airConditioning || undefined,
      hasBalcony: hasBalcony || undefined,
      notificationEmail: notificationEmail || undefined,
    };
  }

  async function loadPreferences(targetUser: string) {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchUserPreferences(targetUser);
      if (data) {
        setMaxRentUsd(data.maxRentUsd);
        setMaxCommuteMinutes(data.maxCommuteMinutes);
        setTargetDestination(data.targetDestination);
        setTransitMode(data.transitMode);
        setTransitModes(data.transitModes || ["bus", "subway", "train"]);
        if (data.selectedTransitModes && data.selectedTransitModes.length > 0) {
          setSelectedTransitModes(data.selectedTransitModes);
        } else {
          setSelectedTransitModes([data.transitMode]);
        }
        setMinBedrooms(data.minBedrooms);
        setMaxBedrooms(data.maxBedrooms);
        setMinBathrooms(data.minBathrooms);
        setMinSquareFeet(data.minSquareFeet);
        setMaxSquareFeet(data.maxSquareFeet);
        setHasGym(Boolean(data.hasGym));
        setHasPool(Boolean(data.hasPool));
        setHasLaundry(Boolean(data.hasLaundry));
        setUtilitiesIncluded(Boolean(data.utilitiesIncluded));
        setHasParking(Boolean(data.hasParking));
        setPetFriendly(Boolean(data.petFriendly));
        setFurnished(Boolean(data.furnished));
        setAirConditioning(Boolean(data.airConditioning));
        setHasBalcony(Boolean(data.hasBalcony));
        if (data.notificationEmail) {
          setNotificationEmail(data.notificationEmail);
        }
        setLastSavedRecord(data);
        if (data.recentMatches && data.recentMatches.length > 0) {
          setMatchedListings(data.recentMatches);
        } else {
          triggerScan(targetUser, data)
            .then((res) => setMatchedListings(res.matches))
            .catch(() => {});
        }
      } else {
        setLastSavedRecord(null);
        // Default clean state for fresh/new user
        setMaxRentUsd(1800);
        setMaxCommuteMinutes(35);
        setTargetDestination("Union Station, Toronto, ON");
        setTransitMode("transit");
        setTransitModes(["bus", "subway", "train"]);
        setSelectedTransitModes(["transit"]);
        setNotificationEmail("");
        resetMarketplaceFilters();
        triggerScan(targetUser, {
          maxRentUsd: 1800,
          maxCommuteMinutes: 35,
          targetDestination: "Union Station, Toronto, ON",
          transitMode: "transit",
        })
          .then((res) => setMatchedListings(res.matches))
          .catch(() => {});
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleScanNow() {
    setIsScanning(true);
    setErrorMessage(null);
    setScanSuccessMessage(null);
    try {
      const params = getActiveFilterParams();
      const result = await triggerScan(activeUserId, params);
      setMatchedListings(result.matches);
      setScanSuccessMessage(
        `Found ${result.count} matching apartment${result.count === 1 ? "" : "s"} across all sources within ${maxCommuteMinutes} mins!`,
      );
      setTimeout(() => setScanSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to scan listings");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleEmailDeals() {
    setIsEmailingDeals(true);
    setErrorMessage(null);
    setEmailSuccessMessage(null);
    try {
      const result = await sendDealsEmail(activeUserId);
      setEmailSuccessMessage(
        result.message ||
        (result.sent
          ? "Dispatched new top deal(s) to your verified email!"
          : "All top deals have already been emailed. You are up to date!"),
      );
      setTimeout(() => setEmailSuccessMessage(null), 6000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send deals email");
    } finally {
      setIsEmailingDeals(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const params = getActiveFilterParams();
      const saved = await saveUserPreferences(activeUserId, params);
      setLastSavedRecord(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      // Refresh matched listings with new criteria
      triggerScan(activeUserId, params)
        .then((res) => setMatchedListings(res.matches))
        .catch(() => { });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmodeToggle(modeName: string) {
    setTransitModes((prev) =>
      prev.includes(modeName) ? prev.filter((m) => m !== modeName) : [...prev, modeName],
    );
  }

  function toggleTransitMode(mode: TransitMode) {
    setSelectedTransitModes((prev) => {
      let updated: TransitMode[];
      if (prev.includes(mode)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        updated = prev.filter((m) => m !== mode);
      } else {
        updated = [...prev, mode];
      }
      setTransitMode(updated[0]);
      return updated;
    });
  }

  function resetMarketplaceFilters() {
    setMinBedrooms(undefined);
    setMaxBedrooms(undefined);
    setMinBathrooms(undefined);
    setMinSquareFeet(undefined);
    setMaxSquareFeet(undefined);
    setHasGym(false);
    setHasPool(false);
    setHasLaundry(false);
    setUtilitiesIncluded(false);
    setHasParking(false);
    setPetFriendly(false);
    setFurnished(false);
    setAirConditioning(false);
    setHasBalcony(false);
  }

  const activeMarketplaceFilterCount = [
    minBedrooms !== undefined,
    maxBedrooms !== undefined,
    minBathrooms !== undefined,
    minSquareFeet !== undefined,
    maxSquareFeet !== undefined,
    hasGym,
    hasPool,
    hasLaundry,
    utilitiesIncluded,
    hasParking,
    petFriendly,
    furnished,
    airConditioning,
    hasBalcony,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">CommuteNest</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Cloud Live
                </span>
              </div>
              <p className="text-xs text-slate-500">Multi-Source Housing Search &amp; Deal Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {backendHealth ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>API Connected (us-east-1)</span>
              </div>
            ) : healthError ? (
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>API Offline</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 flex items-center space-x-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Connecting...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Preferences Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Search &amp; Alert Engine</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize search filters across Craigslist, Kijiji &amp; Public feeds
                  </p>
                </div>

                {/* User ID Switcher */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = userId.trim();
                    if (trimmed && trimmed !== activeUserId) {
                      setActiveUserId(trimmed);
                    }
                  }}
                  className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200"
                >
                  {lastSavedRecord?.updatedAt && (
                    <span className="text-[10px] text-slate-400 hidden sm:inline px-1">
                      Synced {new Date(lastSavedRecord.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  <span className="text-xs font-medium text-slate-500 pl-1">User:</span>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-24 text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="user_id"
                    title="Enter any username to create or switch to your private profile"
                  />
                  {userId.trim() !== activeUserId && (
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Load
                    </button>
                  )}
                </form>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Preferences saved successfully to DynamoDB!</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Free-form Target Destination */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-slate-900">
                      Destination / Work Location
                    </label>
                    <span className="text-xs text-indigo-600 font-medium">Free-form GTA Search</span>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      list="preset-destinations"
                      required
                      value={targetDestination}
                      onChange={(e) => setTargetDestination(e.target.value)}
                      placeholder="Type ANY address, station, or neighbourhood..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <datalist id="preset-destinations">
                      {PRESET_DESTINATIONS.map((preset) => (
                        <option key={preset} value={preset} />
                      ))}
                    </datalist>
                  </div>

                  {/* Destination Chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PRESET_DESTINATIONS.slice(0, 5).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTargetDestination(preset)}
                        className={`text-xs px-2.5 py-0.5 rounded-full border transition ${targetDestination === preset
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {preset.split(",")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commute Time Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-slate-900 flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Maximum Commute Time</span>
                    </label>
                    <span className="text-sm font-bold text-indigo-600 font-mono">
                      {maxCommuteMinutes}
                      <span className="text-xs text-slate-400 font-normal"> min</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={maxCommuteMinutes}
                    onChange={(e) => setMaxCommuteMinutes(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>10m</span>
                    <span>45m</span>
                    <span>90m</span>
                  </div>
                </div>

                {/* Multi-Modal Transit Modes Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-slate-900">
                      Modes of Transportation
                    </label>
                    <span className="text-xs text-slate-500">Multi-select enabled</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    Select multiple modes to enforce that listings are reachable within {maxCommuteMinutes} mins by <strong>ALL</strong> selected modes (e.g. within 15 min walk AND drive).
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "transit", label: "Transit", icon: Bus },
                      { id: "driving", label: "Driving", icon: Car },
                      { id: "walking", label: "Walking", icon: Footprints },
                      { id: "bicycling", label: "Biking", icon: Bike },
                    ].map(({ id, label, icon: Icon }) => {
                      const isSelected = selectedTransitModes.includes(id as TransitMode);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleTransitMode(id as TransitMode)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition relative ${isSelected
                              ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px]">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-semibold">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedTransitModes.includes("transit") && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-600 mb-1.5">
                        Transit Options:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {["bus", "subway", "train"].map((submode) => (
                          <label key={submode} className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={transitModes.includes(submode)}
                              onChange={() => handleSubmodeToggle(submode)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                            <span className="capitalize">{submode}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTransitModes.length > 1 && (
                    <div className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-800 text-xs flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        Matching listings will be verified for <strong>{selectedTransitModes.join(" AND ")}</strong>.
                      </span>
                    </div>
                  )}
                </div>

                {/* Monthly Rent Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-slate-900 flex items-center space-x-1.5">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <span>Maximum Monthly Rent</span>
                    </label>
                    <span className="text-sm font-bold text-indigo-600 font-mono">
                      ${maxRentUsd.toLocaleString()}
                      <span className="text-xs text-slate-400 font-normal"> /mo</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="600"
                    max="4500"
                    step="50"
                    value={maxRentUsd}
                    onChange={(e) => setMaxRentUsd(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>$600</span>
                    <span>$2,500</span>
                    <span>$4,500</span>
                  </div>
                </div>

                {/* Expandable Marketplace Filters Accordion */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setShowMarketplaceFilters(!showMarketplaceFilters)}
                    className="w-full px-4 py-3 bg-white flex items-center justify-between hover:bg-slate-50 transition border-b border-slate-100"
                  >
                    <div className="flex items-center space-x-2">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-bold text-slate-900">
                        Marketplace Filters (Beds, Baths, Sqft, Amenities)
                      </span>
                      {activeMarketplaceFilterCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          {activeMarketplaceFilterCount} active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-normal">Optional</span>
                      {showMarketplaceFilters ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {showMarketplaceFilters && (
                    <div className="p-4 sm:p-5 space-y-4 bg-white animate-fade-in">
                      {/* Bedrooms */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                          <Bed className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Number of Bedrooms</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: "Any", min: undefined, max: undefined },
                            { label: "Studio", min: 0, max: 0 },
                            { label: "1 Bed", min: 1, max: 1 },
                            { label: "2 Beds", min: 2, max: 2 },
                            { label: "3+ Beds", min: 3, max: undefined },
                          ].map((opt) => {
                            const isSelected =
                              minBedrooms === opt.min && maxBedrooms === opt.max;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => {
                                  setMinBedrooms(opt.min);
                                  setMaxBedrooms(opt.max);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bathrooms */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                          <Bath className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Bathrooms</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: "Any", val: undefined },
                            { label: "1+ Bath", val: 1 },
                            { label: "1.5+ Baths", val: 1.5 },
                            { label: "2+ Baths", val: 2 },
                          ].map((opt) => {
                            const isSelected = minBathrooms === opt.val;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setMinBathrooms(opt.val)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Square Footage */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Square Footage (sq ft)</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            placeholder="Min sq ft (e.g. 500)"
                            value={minSquareFeet ?? ""}
                            onChange={(e) =>
                              setMinSquareFeet(e.target.value ? Number(e.target.value) : undefined)
                            }
                            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="number"
                            min="0"
                            step="50"
                            placeholder="Max sq ft (e.g. 1200)"
                            value={maxSquareFeet ?? ""}
                            onChange={(e) =>
                              setMaxSquareFeet(e.target.value ? Number(e.target.value) : undefined)
                            }
                            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Amenities Grid */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          Building &amp; Unit Amenities (Optional)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { label: "Gym in building", state: hasGym, set: setHasGym, icon: Dumbbell },
                            { label: "Swimming Pool", state: hasPool, set: setHasPool, icon: Waves },
                            { label: "In-unit / Building Laundry", state: hasLaundry, set: setHasLaundry, icon: Shirt },
                            { label: "Utilities Included", state: utilitiesIncluded, set: setUtilitiesIncluded, icon: Zap },
                            { label: "Parking Included", state: hasParking, set: setHasParking, icon: Car },
                            { label: "Pet Friendly", state: petFriendly, set: setPetFriendly, icon: Dog },
                            { label: "Furnished Suite", state: furnished, set: setFurnished, icon: Sofa },
                            { label: "Air Conditioning", state: airConditioning, set: setAirConditioning, icon: Wind },
                            { label: "Balcony / Terrace", state: hasBalcony, set: setHasBalcony, icon: Sun },
                          ].map(({ label, state, set, icon: Icon }) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => set(!state)}
                              className={`p-2 rounded-xl text-left border flex items-center space-x-2 transition ${state
                                  ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold shadow-xs"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${state ? "text-indigo-600" : "text-slate-400"}`} />
                              <span className="text-[11px] truncate">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {activeMarketplaceFilterCount > 0 && (
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={resetMarketplaceFilters}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                          >
                            Reset Marketplace Filters
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Alert Notification Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Alert Notification Email (SNS Verified)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="you@outlook.com"
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Instant alerts via AWS SNS are dispatched exclusively for <strong>NEW good deals</strong>.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving || isLoading}
                    className="w-full sm:w-1/2 flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-lg transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Saving to Cloud..." : "Save Preferences"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleScanNow}
                    disabled={isScanning || isLoading}
                    className="w-full sm:w-1/2 flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                    <span>{isScanning ? "Searching Multi-Source..." : "Scan Deals Now"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Live Listings Feed */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Live Matches</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {matchedListings.length} found
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Craigslist, Kijiji &amp; Public feeds • Direct listing links
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEmailDeals}
                  disabled={isEmailingDeals || isScanning}
                  className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm transition disabled:opacity-50"
                  title="Email newly discovered top deals that haven't been sent yet"
                >
                  <Mail className={`w-3.5 h-3.5 ${isEmailingDeals ? "animate-bounce" : ""}`} />
                  <span>{isEmailingDeals ? "Checking..." : "Email New Deals"}</span>
                </button>
              </div>

              {/* Status alerts */}
              {emailSuccessMessage && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{emailSuccessMessage}</span>
                </div>
              )}

              {scanSuccessMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{scanSuccessMessage}</span>
                </div>
              )}

              {/* Listings Cards List */}
              {matchedListings.length > 0 ? (
                <div className="space-y-4">
                  {matchedListings.map((listing) => {
                    const savings = maxRentUsd - listing.priceUsd;
                    const sourceName = listing.sourceName || "Craigslist";
                    const sourceColor =
                      sourceName.toLowerCase().includes("kijiji")
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : sourceName.toLowerCase().includes("padmapper") || sourceName.toLowerCase().includes("syndication")
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : sourceName.toLowerCase().includes("toronto rentals")
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : "bg-purple-50 text-purple-700 border-purple-200";

                    return (
                      <div
                        key={listing.id}
                        className={`p-4 rounded-2xl border transition-all ${listing.isGoodDeal
                            ? "border-amber-200 bg-amber-50/20 shadow-sm hover:border-amber-300 hover:shadow"
                            : "border-slate-200 bg-white shadow-xs hover:border-slate-300"
                          }`}
                      >
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${sourceColor}`}>
                              {sourceName}
                            </span>
                            {listing.isGoodDeal && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Flame className="w-3 h-3 text-amber-600 fill-amber-500 mr-0.5" />
                                Top Deal
                              </span>
                            )}
                            {savings > 0 && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <TrendingDown className="w-3 h-3 mr-0.5" />
                                ${savings} under budget
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-base font-extrabold text-slate-900">${listing.priceUsd}</span>
                            <span className="text-[11px] text-slate-400"> /mo</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors line-clamp-2">
                          {listing.title}
                        </h3>

                        {/* Specs: Bed / Bath / Sqft */}
                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                          <span className="flex items-center space-x-1 font-medium">
                            <Bed className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {listing.bedrooms === 0
                                ? "Studio"
                                : listing.bedrooms !== undefined
                                  ? `${listing.bedrooms} Bed`
                                  : "Studio/1BR"}
                            </span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1 font-medium">
                            <Bath className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {listing.bathrooms !== undefined ? `${listing.bathrooms} Bath` : "1 Bath"}
                            </span>
                          </span>
                          {listing.squareFeet && (
                            <>
                              <span>•</span>
                              <span className="flex items-center space-x-1 font-medium">
                                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{listing.squareFeet} sq ft</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Amenities Tags */}
                        {listing.amenities && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {listing.amenities.gym && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                🏋️ Gym
                              </span>
                            )}
                            {listing.amenities.pool && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                🏊 Pool
                              </span>
                            )}
                            {listing.amenities.laundry && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                🧺 Laundry
                              </span>
                            )}
                            {listing.amenities.utilitiesIncluded && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                💡 Utilities Incl.
                              </span>
                            )}
                            {listing.amenities.parking && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                🅿️ Parking
                              </span>
                            )}
                            {listing.amenities.petFriendly && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                🐾 Pets
                              </span>
                            )}
                            {listing.amenities.furnished && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                🛋️ Furnished
                              </span>
                            )}
                            {listing.amenities.airConditioning && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                ❄️ A/C
                              </span>
                            )}
                            {listing.amenities.balcony && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                🌇 Balcony
                              </span>
                            )}
                          </div>
                        )}

                        {/* Deal reason callout */}
                        {listing.dealReason && (
                          <div className="mt-2 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium flex items-center space-x-1.5">
                            <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{listing.dealReason}</span>
                          </div>
                        )}

                        {/* Address */}
                        <p className="text-xs text-slate-500 mt-2 flex items-center">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                          <span className="truncate">{listing.address}</span>
                        </p>

                        {/* Commute Summary & Breakdown */}
                        <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 truncate">
                            <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-medium truncate">{listing.commuteSummary}</span>
                          </div>
                          {listing.commuteBreakdown && (
                            <div className="flex items-center space-x-2 shrink-0 text-[11px] text-slate-500 font-medium pl-2">
                              {listing.commuteBreakdown.transit !== undefined && (
                                <span>🚇 {listing.commuteBreakdown.transit}m</span>
                              )}
                              {listing.commuteBreakdown.driving !== undefined && (
                                <span>🚗 {listing.commuteBreakdown.driving}m</span>
                              )}
                              {listing.commuteBreakdown.walking !== undefined && (
                                <span>🚶 {listing.commuteBreakdown.walking}m</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Link Button */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                          <a
                            href={listing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                          >
                            <span>Open Direct Post</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                    <Home className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No Listings Matched Current Filters</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Try broadening your rent budget or clearing some optional marketplace filters.
                  </p>
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMaxRentUsd(2500);
                        setMaxCommuteMinutes(45);
                        resetMarketplaceFilters();
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      Reset Filters &amp; Broaden Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-600">CommuteNest</span>
            <span>•</span>
            <span>Free Tier ($0.00) Production Architecture</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>AWS us-east-1</span>
            <span>API Gateway</span>
            <span>DynamoDB</span>
            <span>Amazon SNS</span>
            <span>CloudFront</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
