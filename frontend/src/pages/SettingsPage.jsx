import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  deleteCurrentUserAccount,
  savePrimaryAddress,
  updateCurrentUserPassword,
} from "../api/account";
import {
  disableTwoFactor,
  enableTwoFactor,
  regenerateRecoveryCodes,
  setupTwoFactor,
} from "../api/security";
import api from "../api/axios.config";
import {
  Save,
  AlertCircle,
  X,
  Lock,
  Bell,
  Trash2,
  Eye,
  EyeOff,
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  KeyRound,
  Smartphone,
  Receipt,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

// ------------------------
// Shared UI components
// ------------------------
function SectionCard({ eyebrow, title, description, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Field({ label, icon: Icon, className = "", children, hint }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        {Icon ? <Icon size={16} className="text-slate-400" /> : null}
        {label}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100 ${props.className || ""}`}
    />
  );
}

function Toggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative h-7 w-14 rounded-full transition-colors ${
        enabled ? "bg-rose-500" : "bg-slate-200"
      }`}
    >
      <div
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-8" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function PasswordField({ label, value, name, show, onChange, onToggle }) {
  return (
    <Field label={label} icon={KeyRound}>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className="pr-11"
          autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );
}

// ------------------------
// Main SettingsPage
// ------------------------
export default function SettingsPage() {
  const { user, updateUserProfile, refreshCurrentUser, logoutUser } =
    useContext(AuthContext);
  const navigate = useNavigate();

  const defaultAddress =
    user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || null;

  const [activeSection, setActiveSection] = useState("profile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: defaultAddress?.line1 || "",
    city: defaultAddress?.city || "",
    state: defaultAddress?.state || "",
    zipCode: defaultAddress?.postalCode || "",
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification preferences (from MongoDB)
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    marketing: false,
  });
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  // 2FA state (admin only)
  const [twoFactorSetupData, setTwoFactorSetupData] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorDisableCode, setTwoFactorDisableCode] = useState("");
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Sync profile form when user loads
  useEffect(() => {
    const addr =
      user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || null;
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: addr?.line1 || "",
      city: addr?.city || "",
      state: addr?.state || "",
      zipCode: addr?.postalCode || "",
    });
  }, [user]);

  // Load notification preferences from MongoDB
  useEffect(() => {
    if (!user || notificationsLoaded) return;
    api
      .get("/api/user/notification-preferences")
      .then((res) => {
        if (res.data?.notificationPreferences) {
          setNotifications(res.data.notificationPreferences);
        }
        setNotificationsLoaded(true);
      })
      .catch(() => setNotificationsLoaded(true));
  }, [user, notificationsLoaded]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleProfileChange = (e) =>
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePasswordChange = (e) =>
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setError("Name and email are required");
      return;
    }

    const hasAnyAddressField = Boolean(
      profileForm.address.trim() ||
        profileForm.city.trim() ||
        profileForm.state.trim() ||
        profileForm.zipCode.trim()
    );
    const hasCompleteAddress =
      profileForm.address.trim() &&
      profileForm.city.trim() &&
      profileForm.state.trim() &&
      profileForm.zipCode.trim();

    if (hasAnyAddressField && !hasCompleteAddress) {
      setError("Please complete all address fields or leave them all blank");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
      });
      if (hasCompleteAddress) {
        await savePrimaryAddress({
          line1: profileForm.address,
          city: profileForm.city,
          state: profileForm.state.toUpperCase(),
          postalCode: profileForm.zipCode,
        });
        await refreshCurrentUser();
      }
      showSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCurrentUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showSuccess("Password updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationSave = async () => {
    try {
      setIsSubmitting(true);
      await api.patch("/api/user/notification-preferences", notifications);
      showSuccess("Notification preferences saved.");
    } catch (err) {
      setError("Could not save preferences. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwoFactorSetup = async () => {
    setError(null);
    setTwoFactorLoading(true);
    try {
      const data = await setupTwoFactor();
      setTwoFactorSetupData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not start two-factor setup.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTwoFactorEnable = async () => {
    setError(null);
    setTwoFactorLoading(true);
    try {
      const result = await enableTwoFactor(twoFactorCode);
      await refreshCurrentUser();
      setTwoFactorSetupData(null);
      setTwoFactorCode("");
      setRecoveryCodes(result.recoveryCodes || []);
      setShowRecoveryCodes(true);
      showSuccess("Two-factor authentication is now active.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not enable two-factor authentication.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTwoFactorDisable = async () => {
    setError(null);
    setTwoFactorLoading(true);
    try {
      await disableTwoFactor({
        password: twoFactorDisablePassword,
        code: twoFactorDisableCode,
      });
      await refreshCurrentUser();
      setTwoFactorDisableCode("");
      setTwoFactorDisablePassword("");
      showSuccess("Two-factor authentication has been turned off.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not disable two-factor authentication.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleRecoveryCodeRegenerate = async () => {
    setError(null);
    setTwoFactorLoading(true);
    try {
      const result = await regenerateRecoveryCodes({
        password: twoFactorDisablePassword,
        code: twoFactorDisableCode,
      });
      setRecoveryCodes(result.recoveryCodes || []);
      setShowRecoveryCodes(true);
      showSuccess("Recovery codes regenerated. Save them somewhere safe.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not regenerate recovery codes.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }
    try {
      setIsSubmitting(true);
      await deleteCurrentUserAccount();
      setShowDeleteModal(false);
      await logoutUser();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = user?.role === "admin";

  const sections = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "password", icon: Lock, label: "Password" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    ...(isAdmin ? [{ id: "security", icon: BadgeCheck, label: "Security" }] : []),
    { id: "danger", icon: Trash2, label: "Danger Zone", danger: true },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffe7f2,_#f8fafc_40%,_#f8fafc)]">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-slate-200 p-2.5 transition hover:bg-slate-50"
              >
                <X size={20} className="text-slate-600" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
                  My Account
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-slate-950">Settings</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Manage your profile, password, and preferences.
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* SIDEBAR */}
          <div className="lg:col-span-1">
            <nav className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`w-full rounded-2xl px-4 py-3 text-left font-medium transition ${
                    activeSection === section.id
                      ? "bg-rose-50 text-rose-700"
                      : section.danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <section.icon size={18} />
                    {section.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={18} /> {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <Check size={18} /> {success}
              </div>
            )}

            {/* PROFILE */}
            {activeSection === "profile" && (
              <SectionCard
                eyebrow="Personal Details"
                title="Profile Information"
                description="Your name, email, and default shipping address used at checkout."
              >
                <form onSubmit={handleProfileSubmit} className="space-y-8">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Full Name *" icon={User}>
                      <Input
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        required
                        autoComplete="name"
                        placeholder="Your name"
                      />
                    </Field>
                    <Field label="Email Address *" icon={Mail}>
                      <Input
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </Field>
                    <Field
                      label="Phone Number"
                      icon={Phone}
                      className="md:col-span-2"
                      hint="Optional. Used only if we need to reach you about a shipping issue."
                    >
                      <Input
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        autoComplete="tel"
                        placeholder="(555) 123-4567"
                      />
                    </Field>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Default Shipping Address
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Pre-filled at checkout to save you time.
                        </p>
                      </div>
                      <Receipt className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="mt-5 space-y-5">
                      <Field label="Street Address" icon={MapPin}>
                        <Input
                          name="address"
                          value={profileForm.address}
                          onChange={handleProfileChange}
                          autoComplete="street-address"
                          placeholder="123 Main St"
                        />
                      </Field>
                      <div className="grid gap-5 md:grid-cols-3">
                        <Field label="City">
                          <Input
                            name="city"
                            value={profileForm.city}
                            onChange={handleProfileChange}
                            autoComplete="address-level2"
                            placeholder="Omaha"
                          />
                        </Field>
                        <Field label="State">
                          <Input
                            name="state"
                            maxLength="2"
                            value={profileForm.state}
                            onChange={handleProfileChange}
                            autoComplete="address-level1"
                            placeholder="NE"
                            className="uppercase"
                          />
                        </Field>
                        <Field label="ZIP Code">
                          <Input
                            name="zipCode"
                            value={profileForm.zipCode}
                            onChange={handleProfileChange}
                            autoComplete="postal-code"
                            placeholder="68134"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </SectionCard>
            )}

            {/* PASSWORD */}
            {activeSection === "password" && (
              <SectionCard
                eyebrow="Security"
                title="Change Password"
                description="Choose a strong password you don't use anywhere else."
              >
                <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-5">
                  <PasswordField
                    label="Current Password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    show={showPasswords.current}
                    onChange={handlePasswordChange}
                    onToggle={() =>
                      setShowPasswords((p) => ({ ...p, current: !p.current }))
                    }
                  />
                  <PasswordField
                    label="New Password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    show={showPasswords.new}
                    onChange={handlePasswordChange}
                    onToggle={() =>
                      setShowPasswords((p) => ({ ...p, new: !p.new }))
                    }
                  />
                  <PasswordField
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    show={showPasswords.confirm}
                    onChange={handlePasswordChange}
                    onToggle={() =>
                      setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))
                    }
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    <Lock size={18} />
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </SectionCard>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <SectionCard
                eyebrow="Communication"
                title="Notification Preferences"
                description="Choose what you hear from us. Order updates are always sent — they contain your tracking and delivery information."
              >
                <div className="space-y-5">
                  {/* Order updates — always on, informational only */}
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">Order & shipping updates</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Confirmation and tracking emails. Always sent — cannot be turned off.
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Always on
                    </div>
                  </div>

                  {/* Marketing emails — optional */}
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">New arrivals & offers</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Early access to new collections, restocks, and exclusive discounts.
                      </p>
                    </div>
                    <Toggle
                      enabled={notifications.marketing}
                      onToggle={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          marketing: !prev.marketing,
                        }))
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNotificationSave}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {isSubmitting ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </SectionCard>
            )}

            {/* SECURITY — admin only */}
            {activeSection === "security" && isAdmin && (
              <SectionCard
                eyebrow="Admin Security"
                title="Two-Factor Authentication"
                description="Add a second layer of protection to your admin account. After enabling, you'll need a 6-digit code from your authenticator app each time you sign in."
              >
                <div className="space-y-6">
                  {!user?.twoFactorEnabled ? (
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={handleTwoFactorSetup}
                        disabled={twoFactorLoading}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-50"
                      >
                        <Smartphone size={16} />
                        {twoFactorLoading ? "Preparing..." : "Set up authenticator app"}
                      </button>

                      {twoFactorSetupData && (
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          {twoFactorSetupData.otpAuthUrl && (
                            <div className="flex justify-center">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorSetupData.otpAuthUrl)}`}
                                alt="QR code for authenticator app"
                                className="rounded-2xl border border-slate-200 bg-white p-3"
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Manual entry key
                            </p>
                            <p className="mt-2 break-all rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900">
                              {twoFactorSetupData.manualEntryKey}
                            </p>
                          </div>
                          <p className="text-sm leading-6 text-slate-600">
                            Scan the QR code or enter the key in Google Authenticator,
                            Authy, or 1Password. Then enter the 6-digit code to activate.
                          </p>
                          <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="123456"
                            value={twoFactorCode}
                            onChange={(e) =>
                              setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                          />
                          <button
                            type="button"
                            onClick={handleTwoFactorEnable}
                            disabled={twoFactorLoading || twoFactorCode.length !== 6}
                            className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                          >
                            <BadgeCheck size={16} />
                            Activate 2FA
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
                        <BadgeCheck size={18} />
                        <span className="text-sm font-medium">
                          Two-factor authentication is active
                        </span>
                      </div>
                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-sm font-medium text-slate-900">
                          Enter your password and current code to make changes
                        </p>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Current password"
                          value={twoFactorDisablePassword}
                          onChange={(e) => setTwoFactorDisablePassword(e.target.value)}
                        />
                        <Input
                          type="text"
                          placeholder="Authenticator or recovery code"
                          value={twoFactorDisableCode}
                          onChange={(e) =>
                            setTwoFactorDisableCode(e.target.value.trim().toUpperCase())
                          }
                        />
                        <div className="flex flex-wrap gap-3 pt-1">
                          <button
                            type="button"
                            onClick={handleTwoFactorDisable}
                            disabled={
                              twoFactorLoading ||
                              !twoFactorDisablePassword ||
                              !twoFactorDisableCode
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <X size={16} />
                            Turn off 2FA
                          </button>
                          <button
                            type="button"
                            onClick={handleRecoveryCodeRegenerate}
                            disabled={
                              twoFactorLoading ||
                              !twoFactorDisablePassword ||
                              !twoFactorDisableCode
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"
                          >
                            <BadgeCheck size={16} />
                            Regenerate recovery codes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showRecoveryCodes && recoveryCodes.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-amber-900">
                            Save your recovery codes
                          </p>
                          <p className="mt-1 text-sm text-amber-800">
                            Each code works once. Store them somewhere safe in case you lose access to your authenticator app.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard?.writeText(recoveryCodes.join("\n"))
                          }
                          className="shrink-0 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                        >
                          Copy all
                        </button>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {recoveryCodes.map((code) => (
                          <div
                            key={code}
                            className="rounded-xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm text-slate-900"
                          >
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* DANGER ZONE */}
            {activeSection === "danger" && (
              <SectionCard
                eyebrow="Danger Zone"
                title="Delete Account"
                description="Permanently delete your account and all associated data. This cannot be undone."
              >
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  <Trash2 size={18} />
                  Delete My Account
                </button>
              </SectionCard>
            )}
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Delete Account</h3>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              This will permanently delete your account, saved addresses, and order history.
              Your past orders will remain in our system for record-keeping but will no
              longer be linked to an account.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to
              confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-red-400 focus:outline-none focus:ring-4 focus:ring-red-100"
              placeholder="Type DELETE"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setError(null);
                }}
                className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAccountDeletion}
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-red-600 py-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}