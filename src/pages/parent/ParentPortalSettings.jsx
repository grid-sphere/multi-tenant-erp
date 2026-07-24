import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "../../components/erp/parent/DashboardLayout";
import { getParentProfile, changeMyPassword } from "../../services/parentAPIs";
import api from "../../services/axiosClient";

const Toggle = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-7 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0
      ${enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
  >
    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${enabled ? "right-1" : "left-1"}`} />
  </button>
);

const COUNTRY_CODES = [
  { code: "+1", iso: "us", name: "US", maxDigits: 10 },
  { code: "+44", iso: "gb", name: "UK", maxDigits: 10 },
  { code: "+91", iso: "in", name: "IN", maxDigits: 10 },
  { code: "+92", iso: "pk", name: "PK", maxDigits: 10 },
  { code: "+971", iso: "ae", name: "UAE", maxDigits: 9 },
  { code: "+966", iso: "sa", name: "SA", maxDigits: 9 },
  { code: "+61", iso: "au", name: "AU", maxDigits: 9 },
  { code: "+49", iso: "de", name: "DE", maxDigits: 11 },
  { code: "+33", iso: "fr", name: "FR", maxDigits: 9 },
  { code: "+86", iso: "cn", name: "CN", maxDigits: 11 },
  { code: "+81", iso: "jp", name: "JP", maxDigits: 10 },
  { code: "+55", iso: "br", name: "BR", maxDigits: 11 },
  { code: "+27", iso: "za", name: "ZA", maxDigits: 9 },
  { code: "+234", iso: "ng", name: "NG", maxDigits: 10 },
  { code: "+20", iso: "eg", name: "EG", maxDigits: 10 },
  { code: "+62", iso: "id", name: "ID", maxDigits: 12 },
  { code: "+880", iso: "bd", name: "BD", maxDigits: 10 },
  { code: "+90", iso: "tr", name: "TR", maxDigits: 10 },
  { code: "+98", iso: "ir", name: "IR", maxDigits: 10 },
  { code: "+7", iso: "ru", name: "RU", maxDigits: 10 },
];

function FlagImg({ iso, className = "" }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${iso}.png`}
      srcSet={`https://flagcdn.com/w40/${iso}.png 2x`}
      alt={iso}
      className={`rounded-sm object-cover flex-shrink-0 ${className}`}
      style={{ width: "18px", height: "13px" }}
    />
  );
}

function CountryCodePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = COUNTRY_CODES.find((c) => c.code === value) || COUNTRY_CODES[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ minWidth: "76px" }}
        className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-2 text-xs font-medium text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none"
      >
        <FlagImg iso={selected.iso} />
        <span className="truncate">{selected.code}</span>
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-300 flex-shrink-0" style={{ fontSize: "13px" }}>
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden"
          style={{ minWidth: "148px" }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: "176px" }}>
            {COUNTRY_CODES.map(({ code, iso, name }) => (
              <button
                key={code}
                type="button"
                onClick={() => { onChange(code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left
                  ${code === value
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-semibold"
                    : "text-slate-800 dark:text-white"
                  }`}
              >
                <FlagImg iso={iso} />
                <span className="font-medium">{name}</span>
                <span className="ml-auto text-slate-400 dark:text-slate-400">{code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ParentPortalSettings = () => {

  const [isDark, setIsDark] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("parent_theme") === "dark"
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("parent_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("parent_theme", "light");
    }
  }, [isDark]);

  const [notifs, setNotifs] = useState({ email: true, push: true, sms: false });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("Mother");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [dob, setDob] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const fileInputRef = useRef(null);

  // ── Password change ──
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getParentProfile();
        setFirstName(profileData.first_name || "");
        setLastName(profileData.last_name || "");
        setEmail(profileData.email || "");
        setPhone(profileData.phone_number || "");
        setAddress(profileData.address || "");
        setOccupation(profileData.occupation || "");
        setEmergencyContact(profileData.emergency_contact_number || "");
        setDob(profileData.date_of_birth || "");
        setRelationship(profileData.relationship || profileData.relationship_to_student || "Mother");

        // Get signed URL if profile picture exists
        if (profileData.profile_picture) {
          try {
            const picRes = await api.get(`/profiles/me/picture/?profile_type=parent`);
            if (picRes.data.has_picture) {
              setProfilePicUrl(picRes.data.url);
            }
          } catch {
            setProfilePicUrl(null);
          }
        }
      } catch (err) {
        console.error("Couldn't fetch parent profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handlePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const userData = JSON.parse(localStorage.getItem("user_data") || "null");
      const userId = userData?.identity?.id || null;

      let newFilePath = null;

      // Upload profile picture
      if (profilePicFile) {
        const urlRes = await api.post(`/uploads/profile-image/`, {
          file_name: profilePicFile.name,
          content_type: profilePicFile.type,
          profile_type: "parent",
        });

        const { upload_url, file_path } = urlRes.data;

        await fetch(upload_url, {
          method: "PUT",
          body: profilePicFile,
          headers: { "Content-Type": profilePicFile.type },
        });

        await api.post(`/uploads/confirm/`, {
          file_path,
          file_type: "profile_picture",
        });

        newFilePath = file_path; // save for profile update
        setProfilePicFile(null);
      }

      // Save profile data — include profile_picture if uploaded
      const payload = {
        user: userId,
        phone_number: phone,
        address,
        occupation,
        emergency_contact_number: emergencyContact,
      };
      if (dob) payload.date_of_birth = dob;
      if (newFilePath) payload.profile_picture = newFilePath; // ← this is the fix

      await api.patch(`/profiles/parents/me/`, payload);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed", err);
      setSaveError("Failed to save. Please try again.");
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordMsg(null);

    if (!oldPassword.trim()) {
      setPasswordMsg({ type: "error", text: "Please enter your current password." });
      return;
    }
    if (!newPassword.trim()) {
      setPasswordMsg({ type: "error", text: "Please enter a new password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changeMyPassword({ oldPassword, newPassword, confirmPassword });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({
        type: "success",
        text: res?.message || "Password changed successfully!",
      });
    } catch (err) {
      console.error("Failed to update password:", err);
      const errData = err.response?.data?.error;
      const text = Array.isArray(errData)
        ? errData.join(" ")
        : errData || "Failed to update password. Please try again.";
      setPasswordMsg({ type: "error", text });
    } finally {
      setPasswordSaving(false);
    }
  };

  const avatarSrc =
    profilePicPreview ||
    profilePicUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName} ${lastName}`.trim() || "P")}&background=3b82f6&color=fff`;

  const inputCls =
    "w-full rounded-lg px-3 py-2 text-xs border-none outline-none " +
    "bg-slate-100 dark:bg-slate-700 " +
    "text-slate-800 dark:text-white " +
    "placeholder:text-slate-400 dark:placeholder:text-slate-400 " +
    "focus:ring-2 focus:ring-blue-500 transition-all";

  const readonlyCls =
    "w-full rounded-lg px-3 py-2 text-xs border-none outline-none " +
    "bg-slate-50 dark:bg-slate-700/50 " +
    "text-slate-500 dark:text-slate-400 " +
    "cursor-not-allowed select-none";

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-5 max-w-7xl mx-auto flex flex-col gap-3 sm:gap-2">

        <div>
          <h1 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
            Manage your account preferences and configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-2">

          {/* ── Account Profile ── */}
          <section className="xl:col-span-7 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col transition-colors duration-300">

            {/* <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-lg material-symbols-outlined text-xs">person</span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Account Profile</h2>
            </div> */}

            {/* Profile picture */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-shrink-0">
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-600"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow hover:bg-blue-700 transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>edit</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePicChange}
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {[firstName, lastName].filter(Boolean).map(n => n[0].toUpperCase() + n.slice(1)).join(" ") || "Parent"}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{email}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] text-blue-500 dark:text-blue-400 mt-1 hover:underline"
                >
                  Change photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">

              {/* First Name — readonly */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">
                  First Name
                </label>
                <div className="relative">
                  <input type="text" value={firstName} readOnly className={readonlyCls} />
                  <span
                    title="Name can only be changed by school admin"
                    className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 dark:text-slate-600 cursor-help"
                    style={{ fontSize: "14px" }}
                  >
                    info
                  </span>
                </div>
              </div>

              {/* Last Name — readonly */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">
                  Last Name
                </label>
                <div className="relative">
                  <input type="text" value={lastName} readOnly className={readonlyCls} />
                  <span
                    title="Name can only be changed by school admin"
                    className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 dark:text-slate-600 cursor-help"
                    style={{ fontSize: "14px" }}
                  >
                    info
                  </span>
                </div>
              </div>

              {/* Email — readonly */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <input type="email" value={email} readOnly className={readonlyCls} />
                  <span
                    title="Email can only be changed by school admin"
                    className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 dark:text-slate-600 cursor-help"
                    style={{ fontSize: "14px" }}
                  >
                    info
                  </span>
                </div>
              </div>

              {/* Relationship — readonly */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">
                  Relationship
                </label>
                <div className="relative">
                  <input type="text" value={relationship} readOnly className={readonlyCls} />
                  <span
                    title="Relationship is set by school admin"
                    className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 dark:text-slate-600 cursor-help"
                    style={{ fontSize: "14px" }}
                  >
                    info
                  </span>
                </div>
              </div>

              {/* Date of Birth — editable */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Occupation — editable */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className={inputCls}
                />
              </div>

              {/* Phone — editable */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Phone Number</label>
                <div className="flex gap-1.5">
                  <CountryCodePicker
                    value={countryCode}
                    onChange={(c) => { setCountryCode(c); setPhone(""); }}
                  />
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        const onlyNums = e.target.value.replace(/\D/g, "");
                        const selected = COUNTRY_CODES.find((c) => c.code === countryCode);
                        const max = selected?.maxDigits || 10;
                        if (onlyNums.length <= max) setPhone(onlyNums);
                      }}
                      placeholder="Phone number"
                      className={`${inputCls} pr-10`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-300 pointer-events-none whitespace-nowrap">
                      {phone.length}/{COUNTRY_CODES.find((c) => c.code === countryCode)?.maxDigits || 10}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address — editable */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address"
                  className={inputCls}
                />
              </div>

              {/* Emergency Contact — editable */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Emergency Contact Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={emergencyContact}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, "");
                    if (onlyNums.length <= 15) setEmergencyContact(onlyNums);
                  }}
                  placeholder="Emergency phone number"
                  className={inputCls}
                />
              </div>

            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              {saveError && <p className="text-xs text-red-500 dark:text-red-400">{saveError}</p>}
              <div className="ml-auto">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-sm">
                    {saving ? "hourglass_empty" : saved ? "check" : "save"}
                  </span>
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          </section>

          {/* ── Right column ── */}
          <div className="xl:col-span-5 flex flex-col gap-3 sm:gap-2">

            {/* Language & Appearance */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3 transition-colors duration-300">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-lg material-symbols-outlined text-xs">language</span>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Language &amp; Appearance</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Language</label>
                  <div className="flex items-center justify-between px-2.5 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <span className="text-xs font-medium text-slate-800 dark:text-white truncate mr-1">English (US)</span>
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-300 flex-shrink-0" style={{ fontSize: "14px" }}>expand_more</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Timezone</label>
                  <div className="flex items-center justify-between px-2.5 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <span className="text-xs font-medium text-slate-800 dark:text-white truncate mr-1">GMT−05:00 ET</span>
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-300 flex-shrink-0" style={{ fontSize: "14px" }}>expand_more</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsDark(false)}
                  className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg border text-xs font-semibold transition-all duration-200
                    ${!isDark
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300"
                      : "border-transparent bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                >
                  <span className="material-symbols-outlined text-sm">light_mode</span>
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setIsDark(true)}
                  className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg border text-xs font-semibold transition-all duration-200
                    ${isDark
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                      : "border-transparent bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                >
                  <span className="material-symbols-outlined text-sm">dark_mode</span>
                  Dark
                </button>
              </div>
            </div>

            {/* AI Configuration */}
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 sm:p-4 border-l-4 border-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-300">
              <div className="flex items-start gap-2 min-w-0">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-300 text-xs mt-0.5 flex-shrink-0">auto_awesome</span>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">AI Configuration</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Customize how AI analyzes your child's performance.
                  </p>
                </div>
              </div>
              <button className="flex-shrink-0 w-full sm:w-auto bg-amber-600 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
                Manage →
              </button>
            </div>

            {/* Account Security */}
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 sm:p-4 flex flex-col gap-3 transition-colors duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="material-symbols-outlined text-red-500 dark:text-red-300 text-xs mt-0.5 flex-shrink-0">warning</span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-red-600 dark:text-red-300">Account Security</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Reset password or sign out of all devices.
                    </p>
                  </div>
                </div>
                <button className="flex-shrink-0 w-full sm:w-auto bg-red-500 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors whitespace-nowrap">
                  Sign Out All
                </button>
              </div>

              <div className="pl-0 sm:pl-6 space-y-2">
                {passwordMsg && (
                  <div
                    className={`text-[10px] font-semibold rounded-lg px-2.5 py-2 ${passwordMsg.type === "success"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300"
                      }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Current Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={inputCls}
                  />
                </div>

                <button
                  onClick={handlePasswordUpdate}
                  disabled={passwordSaving}
                  className="w-full sm:w-auto bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Notifications ── */}
          <section className="xl:col-span-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-lg material-symbols-outlined text-xs">notifications_active</span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Notification Preferences</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
              {[
                { key: "email", icon: "mail", label: "Email Summaries", desc: "Weekly digests of child progress" },
                { key: "push", icon: "smartphone", label: "Push Notifications", desc: "Real-time alerts for absences" },
                { key: "sms", icon: "sms", label: "SMS Alerts", desc: "Emergency weather or security info" },
              ].map(({ key, icon, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className={`material-symbols-outlined text-sm ${notifs[key] ? "text-blue-600 dark:text-blue-300" : "text-slate-400 dark:text-slate-300"}`}>
                        {icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate">{label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5 truncate">{desc}</p>
                    </div>
                  </div>
                  <Toggle
                    enabled={notifs[key]}
                    onToggle={() => setNotifs((p) => ({ ...p, [key]: !p[key] }))}
                  />
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentPortalSettings;