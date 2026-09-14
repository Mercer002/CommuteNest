import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Bike,
  Bus,
  Car,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  Flame,
  Footprints,
  Home,
  Layers,
  Mail,
  MapPin,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { API_BASE_URL, fetchHealth, fetchUserPreferences, saveUserPreferences, sendDealsEmail, triggerScan } from "./api.js";
import type { MatchedListing, TransitMode, UserPreferences } from "./types.js";

const PRESET_DESTINATIONS = [
  "Union Station, Toronto, ON",
  "Financial District, Toronto, ON",
  "Yonge & Bloor, Toronto, ON",
  "U of T St. George, Toronto, ON",
];

export function App() {
  const [userId, setUserId] = useState("mercer");
  const [activeUserId, setActiveUserId] = useState("mercer");

  // Form state
  const [maxRentUsd, setMaxRentUsd] = useState(1750);
  const [maxCommuteMinutes, setMaxCommuteMinutes] = useState(30);
  const [targetDestination, setTargetDestination] = useState("Union Station, Toronto, ON");
  const [transitMode, setTransitMode] = useState<TransitMode>("transit");
  const [transitModes, setTransitModes] = useState<string[]>(["bus", "subway", "train"]);
  const [notificationEmail, setNotificationEmail] = useState("demo@example.com");

  // UI state
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

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Load preferences when activeUserId changes
  useEffect(() => {
    loadPreferences(activeUserId);
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
        if (data.notificationEmail) {
          setNotificationEmail(data.notificationEmail);
        }
        setLastSavedRecord(data);
        if (data.recentMatches && data.recentMatches.length > 0) {
          setMatchedListings(data.recentMatches);
        } else {
          // Trigger scan to populate initial matches
          triggerScan(targetUser, {
            maxRentUsd: data.maxRentUsd,
            maxCommuteMinutes: data.maxCommuteMinutes,
            targetDestination: data.targetDestination,
            transitMode: data.transitMode,
            transitModes: data.transitModes,
          })
            .then((res) => setMatchedListings(res.matches))
            .catch(() => { });
        }
      } else {
        setLastSavedRecord(null);
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
      const result = await triggerScan(activeUserId, {
        maxRentUsd,
        maxCommuteMinutes,
        targetDestination,
        transitMode,
        transitModes,
      });
      setMatchedListings(result.matches);
      setScanSuccessMessage(`Found ${result.count} matching apartment${result.count === 1 ? "" : "s"} within ${maxCommuteMinutes} mins!`);
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
      setEmailSuccessMessage(result.message || `Sent ${result.dealsCount} top deal(s) to your verified email!`);
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
      const saved = await saveUserPreferences(activeUserId, {
        maxRentUsd,
        maxCommuteMinutes,
        targetDestination,
        transitMode,
        transitModes,
        notificationEmail: notificationEmail || undefined,
      });
      setLastSavedRecord(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      // Refresh matched listings with new criteria
      triggerScan(activeUserId, {
        maxRentUsd,
        maxCommuteMinutes,
        targetDestination,
        transitMode,
        transitModes,
      })
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
              <p className="text-xs text-slate-500">Serverless Commute-Optimized Housing Alert Engine</p>
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Preferences Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Alert Preferences</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Customize your housing search criteria stored in DynamoDB
                  </p>
                </div>

                {/* User Selector */}
                <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2">
                    User:
                  </span>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="text-xs font-mono font-medium px-2 py-1 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-24 text-slate-800"
                    placeholder="userId"
                  />
                  <button
                    type="button"
                    onClick={() => setActiveUserId(userId)}
                    disabled={isLoading || !userId.trim()}
                    className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    Switch
                  </button>
                </div>
              </div>

              {/* Status messages */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <p className="font-medium">Error saving preferences</p>
                    <p className="text-xs mt-0.5 text-rose-700">{errorMessage}</p>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="font-medium">
                    Preferences successfully saved to DynamoDB! The ingestion worker will use these on the next run.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Target Destination */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Target Destination
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={targetDestination}
                      onChange={(e) => setTargetDestination(e.target.value)}
                      placeholder="e.g. Union Station, Toronto, ON"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>

                  {/* Destination Chips */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {PRESET_DESTINATIONS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTargetDestination(preset)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${targetDestination === preset
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Monthly Rent Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-900 flex items-center space-x-1.5">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <span>Maximum Monthly Rent</span>
                    </label>
                    <span className="text-base font-bold text-indigo-600 font-mono">
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

                {/* Max Commute Time Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-900 flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Maximum Commute Time</span>
                    </label>
                    <span className="text-base font-bold text-indigo-600 font-mono">
                      {maxCommuteMinutes}
                      <span className="text-xs text-slate-400 font-normal"> minutes</span>
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

                {/* Transit Mode Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Preferred Mode of Transit
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "transit", label: "Public Transit", icon: Bus },
                      { id: "driving", label: "Driving", icon: Car },
                      { id: "bicycling", label: "Bicycling", icon: Bike },
                      { id: "walking", label: "Walking", icon: Footprints },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTransitMode(id as TransitMode)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition ${transitMode === id
                          ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>

                  {transitMode === "transit" && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-2">
                        Included Transit Types:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {["bus", "subway", "train"].map((submode) => (
                          <label key={submode} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={transitModes.includes(submode)}
                              onChange={() => handleSubmodeToggle(submode)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span className="capitalize">{submode}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Alert Notification Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Alert Notification Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="you@outlook.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Free Tier compliant via Amazon SNS email protocol (1,000 free emails/mo).
                  </p>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {lastSavedRecord?.updatedAt ? (
                      <span>Last updated: {new Date(lastSavedRecord.updatedAt).toLocaleTimeString()}</span>
                    ) : (
                      <span>Not yet saved</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving || isLoading}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-200 disabled:opacity-50 transition"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Architecture & Pipeline Live Status */}
          <div className="lg:col-span-5 space-y-6">
            {/* Serverless Architecture Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7">
              <div className="flex items-center space-x-2.5 mb-4">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Serverless Architecture</h3>
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                CommuteNest runs continuously on AWS Serverless infrastructure with automated lifecycle management.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">EventBridge Cron Rule</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Invokes the Ingestion Lambda on a recurring 30-minute rate schedule.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">DynamoDB Deduplication &amp; TTL</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Prevents duplicate alerts. Old listings automatically purge after 30 days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Good Deals Email Alerts Only</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      To prevent inbox spam, email notifications via Amazon SNS are sent exclusively for NEW listings that are verified high-value deals ($100+ savings or top 25% fastest commutes).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Cloud Configuration Summary */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg">
              <h3 className="font-bold text-sm tracking-wide text-indigo-200 uppercase mb-4">
                Active Live Configuration
              </h3>

              <dl className="space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-indigo-800/60">
                  <dt className="text-indigo-300">Active Profile</dt>
                  <dd className="font-mono font-medium text-white">{activeUserId}</dd>
                </div>
                <div className="flex justify-between pb-2 border-b border-indigo-800/60">
                  <dt className="text-indigo-300">Budget Ceiling</dt>
                  <dd className="font-mono font-medium text-emerald-400">${maxRentUsd}/mo</dd>
                </div>
                <div className="flex justify-between pb-2 border-b border-indigo-800/60">
                  <dt className="text-indigo-300">Commute Cap</dt>
                  <dd className="font-mono font-medium text-white">{maxCommuteMinutes} minutes</dd>
                </div>
                <div className="flex justify-between pb-2 border-b border-indigo-800/60">
                  <dt className="text-indigo-300">Target Hub</dt>
                  <dd className="font-medium text-right text-indigo-100 truncate max-w-[180px]">
                    {targetDestination}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-indigo-300">API Endpoint</dt>
                  <dd className="font-mono text-[10px] text-indigo-200 truncate max-w-[180px]">
                    {API_BASE_URL}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Live Matched Listings Feed */}
        <section id="matched-listings" className="mt-12 pt-10 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Live Matched Apartments
                </h2>
                <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {matchedListings.length} Available
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                All matching apartments render below. Instant email alerts trigger strictly for <strong className="text-amber-600 font-semibold">🔥 Top Deals</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleEmailDeals}
                disabled={isEmailingDeals || isScanning}
                className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm hover:shadow transition disabled:opacity-50"
                title="Email only high-value deals ($100+ savings or top commutes) to your address"
              >
                <Mail className={`w-4 h-4 ${isEmailingDeals ? "animate-bounce" : ""}`} />
                <span>{isEmailingDeals ? "Sending Deals..." : "Email Me Top Deals"}</span>
              </button>

              <button
                type="button"
                onClick={handleScanNow}
                disabled={isScanning || isEmailingDeals}
                className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? "Scanning Feeds..." : "Scan for Matches"}</span>
              </button>
            </div>
          </div>

          {/* Success toasts / notifications */}
          {emailSuccessMessage && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center space-x-2 animate-fade-in shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{emailSuccessMessage}</span>
            </div>
          )}

          {scanSuccessMessage && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2 animate-fade-in shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{scanSuccessMessage}</span>
            </div>
          )}

          {/* Listings Cards Grid */}
          {matchedListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedListings.map((listing) => {
                const savings = maxRentUsd - listing.priceUsd;
                return (
                  <div
                    key={listing.id}
                    className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group ${listing.isGoodDeal
                        ? "border-amber-200 shadow-md shadow-amber-500/5 hover:border-amber-300 hover:shadow-lg"
                        : "border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                      }`}
                  >
                    <div className="p-5 sm:p-6">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {listing.commuteMinutes} min commute
                          </span>
                          {listing.isGoodDeal && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 mr-1" />
                              Top Deal
                            </span>
                          )}
                        </div>
                        {savings > 0 && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <TrendingDown className="w-3.5 h-3.5 mr-1" />
                            ${savings} under budget
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {listing.title}
                      </h3>

                      {/* Deal highlight callout */}
                      {listing.dealReason && (
                        <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-900 font-medium flex items-center space-x-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{listing.dealReason}</span>
                        </div>
                      )}

                      {/* Address */}
                      <p className="text-xs text-slate-500 mt-2.5 flex items-center">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                        <span className="truncate">{listing.address}</span>
                      </p>

                      {/* Commute Summary Pill */}
                      <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center space-x-2">
                        <Compass className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-medium">{listing.commuteSummary}</span>
                      </div>
                    </div>

                    {/* Footer with Price and Action */}
                    <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-extrabold text-slate-900">${listing.priceUsd}</span>
                        <span className="text-xs text-slate-400 font-medium"> / month</span>
                      </div>

                      <a
                        href={listing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-200 shadow-sm transition"
                      >
                        <span>View Listing</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Listings Matched Current Criteria</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5">
                No apartments currently meet a maximum rent of <strong className="text-slate-700">${maxRentUsd}/mo</strong> and a <strong className="text-slate-700">{maxCommuteMinutes}-minute</strong> travel time to {targetDestination.split(",")[0]}.
              </p>
              <div className="mt-5 flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setMaxRentUsd(2200);
                    setMaxCommuteMinutes(40);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Broaden to $2,200 &amp; 40 min
                </button>
                <button
                  type="button"
                  onClick={handleScanNow}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition"
                >
                  Scan Now
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>CommuteNest Serverless Portfolio Project &bull; Built with AWS Lambda, DynamoDB, API Gateway, SNS, React &amp; Tailwind</p>
      </footer>
    </div>
  );
}

export default App;
