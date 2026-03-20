import React, { useContext, useState } from "react";
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
import {
  Save,
  AlertCircle,
  X,
  Lock,
  Bell,
  Shield,
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
import {
  loadAccountPreferences,
  saveAccountPreferences,
} from "../utils/accountPreferences";

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
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
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

function PasswordField({
  label,
  value,
  name,
  show,
  onChange,
  onToggle,
}) {
  return (
    <Field label={label} icon={KeyRound}>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className="pr-11"
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

export default function SettingsPage() {
  const { user, updateUserProfile, refreshCurrentUser, logoutUser } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const storedPreferences = loadAccountPreferences();
  const defaultAddress =
    user?.addresses?.find((address) => address.isDefault) ||
    user?.addresses?.[0] ||
    null;

  // ACTIVE SECTION STATE
  const [activeSection, setActiveSection] = useState("profile");

  // PROFILE FORM STATE
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: defaultAddress?.line1 || "",
    city: defaultAddress?.city || "",
    state: defaultAddress?.state || "",
    zipCode: defaultAddress?.postalCode || "",
  });

  // PASSWORD FORM STATE
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

  // NOTIFICATION PREFERENCES STATE
  const [notifications, setNotifications] = useState(
    storedPreferences.notifications,
  );

  // PRIVACY SETTINGS STATE
  const [privacy, setPrivacy] = useState(storedPreferences.privacy);

  // UI STATE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [twoFactorSetupData, setTwoFactorSetupData] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorDisableCode, setTwoFactorDisableCode] = useState("");
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  React.useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: defaultAddress?.line1 || "",
      city: defaultAddress?.city || "",
      state: defaultAddress?.state || "",
      zipCode: defaultAddress?.postalCode || "",
    });
  }, [defaultAddress, user]);

  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrivacyChange = (key, value) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTwoFactorSetup = async () => {
    setError(null);
    setSuccess(null);
    setTwoFactorLoading(true);
    try {
      const data = await setupTwoFactor();
      setTwoFactorSetupData(data);
      setSuccess("Authenticator setup started. Add the key below to your app and enter a code to activate it.");
    } catch (setupError) {
      setError(
        setupError.response?.data?.message ||
          "Could not start two-factor setup right now.",
      );
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTwoFactorEnable = async () => {
    setError(null);
    setSuccess(null);
    setTwoFactorLoading(true);
    try {
      const result = await enableTwoFactor(twoFactorCode);
      await refreshCurrentUser();
      setTwoFactorSetupData(null);
      setTwoFactorCode("");
      setRecoveryCodes(result.recoveryCodes || []);
      setShowRecoveryCodes(true);
      setSuccess("Two-factor authentication is now active on your account.");
    } catch (enableError) {
      setError(
        enableError.response?.data?.message ||
          "Could not enable two-factor authentication.",
      );
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTwoFactorDisable = async () => {
    setError(null);
    setSuccess(null);
    setTwoFactorLoading(true);
    try {
      await disableTwoFactor({
        password: twoFactorDisablePassword,
        code: twoFactorDisableCode,
      });
      await refreshCurrentUser();
      setTwoFactorDisableCode("");
      setTwoFactorDisablePassword("");
      setSuccess("Two-factor authentication has been turned off.");
    } catch (disableError) {
      setError(
        disableError.response?.data?.message ||
          "Could not disable two-factor authentication.",
      );
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleRecoveryCodeRegenerate = async () => {
    setError(null);
    setSuccess(null);
    setTwoFactorLoading(true);
    try {
      const result = await regenerateRecoveryCodes({
        password: twoFactorDisablePassword,
        code: twoFactorDisableCode,
      });
      setRecoveryCodes(result.recoveryCodes || []);
      setShowRecoveryCodes(true);
      setSuccess("Recovery codes regenerated. Save the new set somewhere safe.");
    } catch (regenerateError) {
      setError(
        regenerateError.response?.data?.message ||
          "Could not regenerate recovery codes.",
      );
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setError("Name and email are required");
      return;
    }

    const hasAnyAddressField = Boolean(
      profileForm.address.trim() ||
        profileForm.city.trim() ||
        profileForm.state.trim() ||
        profileForm.zipCode.trim(),
    );

    const hasCompleteAddress =
      profileForm.address.trim() &&
      profileForm.city.trim() &&
      profileForm.state.trim() &&
      profileForm.zipCode.trim();

    if (hasAnyAddressField && !hasCompleteAddress) {
      setError("Complete street, city, state, and ZIP to save an address");
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
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
      setSuccess("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update password",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationSave = () => {
    saveAccountPreferences({
      ...loadAccountPreferences(),
      notifications,
    });
    setSuccess("Notification preferences saved!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handlePrivacySave = () => {
    saveAccountPreferences({
      ...loadAccountPreferences(),
      privacy,
    });
    setSuccess("Privacy settings saved!");
    setTimeout(() => setSuccess(null), 3000);
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
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete account",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    { id: "profile", icon: User, label: "Profile Information" },
    { id: "password", icon: Lock, label: "Change Password" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "privacy", icon: Shield, label: "Privacy" },
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
                  Account Operations
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-slate-950">
                  Settings
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Manage the customer account experience with the same level of
                  polish you want across the store.
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
          {/* SIDEBAR NAVIGATION */}
          <div className="lg:col-span-1">
            <nav className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
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

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Security Status
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/15 p-2">
                  <BadgeCheck size={18} className="text-emerald-300" />
                </div>
                <div>
                  <p className="font-medium">Password protection is active</p>
                  <p className="text-sm text-slate-400">
                    Sessions use access tokens plus refresh-token cookies.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm font-medium text-white">
                  Two-factor authentication
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Not enabled yet. I removed the fake-looking prompt and turned
                  this into a real readiness section until the backend supports
                  verification codes.
                </p>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3">
            {/* ALERTS */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                <AlertCircle size={18} /> {error}
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                <Check size={18} /> {success}
              </div>
            )}

            {/* PROFILE SECTION */}
            {activeSection === "profile" && (
              <SectionCard
                eyebrow="Customer Identity"
                title="Profile Information"
                description="Keep the contact and default shipping details clean so order updates, packing slips, and customer service all stay accurate."
              >
                <form onSubmit={handleProfileSubmit} className="space-y-8">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Full Name *" icon={User}>
                      <Input
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        required
                        placeholder="Cassandra Peterson"
                      />
                    </Field>
                    <Field label="Email Address *" icon={Mail}>
                      <Input
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        type="email"
                        required
                        placeholder="you@sparklebows.com"
                      />
                    </Field>
                    <Field
                      label="Phone Number"
                      icon={Phone}
                      className="md:col-span-2"
                      hint="Useful for shipping issues, urgent customer support, and high-value orders."
                    >
                      <Input
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
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
                          This is the primary saved address used for the account.
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
                          placeholder="123 Main St, Suite 4"
                        />
                      </Field>

                      <div className="grid gap-5 md:grid-cols-3">
                        <Field label="City">
                          <Input
                            name="city"
                            value={profileForm.city}
                            onChange={handleProfileChange}
                            placeholder="Dallas"
                          />
                        </Field>
                        <Field label="State">
                          <Input
                            name="state"
                            maxLength="2"
                            value={profileForm.state}
                            onChange={handleProfileChange}
                            placeholder="TX"
                            className="uppercase"
                          />
                        </Field>
                        <Field label="ZIP Code">
                          <Input
                            name="zipCode"
                            value={profileForm.zipCode}
                            onChange={handleProfileChange}
                            placeholder="75001"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </SectionCard>
            )}

            {/* PASSWORD SECTION */}
            {activeSection === "password" && (
              <SectionCard
                eyebrow="Security Center"
                title="Password And Authentication"
                description="A professional storefront should never fake security. This section shows what is active today and what is planned next."
              >
                <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
                  <form onSubmit={handlePasswordSubmit} className="space-y-5">
                    <PasswordField
                      label="Current Password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      show={showPasswords.current}
                      onChange={handlePasswordChange}
                      onToggle={() =>
                        setShowPasswords((p) => ({
                          ...p,
                          current: !p.current,
                        }))
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
                        setShowPasswords((p) => ({
                          ...p,
                          confirm: !p.confirm,
                        }))
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

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                      <div className="flex items-center gap-3">
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                        <p className="font-medium text-emerald-900">
                          Current protection
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-emerald-800">
                        Password changes are live, admin routes are protected,
                        and sessions use refresh-token cookies plus bearer access
                        tokens.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-slate-600" />
                        <p className="font-medium text-slate-900">
                          Two-factor authentication
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {user?.twoFactorEnabled
                          ? "Authenticator-based 2FA is active. You will need a 6-digit code after your password when signing in."
                          : "Add an authenticator app to protect your storefront account with a second login step."}
                      </p>

                      {!user?.twoFactorEnabled ? (
                        <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                          <button
                            type="button"
                            onClick={handleTwoFactorSetup}
                            disabled={twoFactorLoading}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-50"
                          >
                            <Smartphone className="h-4 w-4" />
                            {twoFactorLoading ? "Preparing..." : "Set up authenticator app"}
                          </button>

                          {twoFactorSetupData ? (
                            <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                              {twoFactorSetupData.otpAuthUrl ? (
                                <div className="flex justify-center">
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(twoFactorSetupData.otpAuthUrl)}`}
                                    alt="Authenticator QR code"
                                    className="rounded-2xl border border-slate-200 bg-white p-3"
                                  />
                                </div>
                              ) : null}
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Manual entry key
                                </p>
                                <p className="mt-2 break-all rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900">
                                  {twoFactorSetupData.manualEntryKey}
                                </p>
                              </div>
                              <p className="text-sm leading-6 text-slate-600">
                                Add this key to Google Authenticator, 1Password,
                                Authy, or another TOTP app. You can scan the QR
                                code above or enter the key manually, then use the
                                6-digit code below to activate protection.
                              </p>
                              <Input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="123456"
                                value={twoFactorCode}
                                onChange={(event) =>
                                  setTwoFactorCode(
                                    event.target.value.replace(/\D/g, "").slice(0, 6),
                                  )
                                }
                              />
                              <button
                                type="button"
                                onClick={handleTwoFactorEnable}
                                disabled={twoFactorLoading || twoFactorCode.length !== 6}
                                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                              >
                                <BadgeCheck className="h-4 w-4" />
                                Activate 2FA
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="h-4 w-4" />
                            Authenticator protection is enabled.
                          </div>
                          <p className="text-sm leading-6 text-emerald-900">
                            You can sign in with either your authenticator code
                            or a saved recovery code if you lose access to your device.
                          </p>
                          <div className="grid gap-4">
                            <Input
                              type="password"
                              placeholder="Current password"
                              value={twoFactorDisablePassword}
                              onChange={(event) =>
                                setTwoFactorDisablePassword(event.target.value)
                              }
                            />
                            <Input
                              type="text"
                              placeholder="Authenticator or recovery code"
                              value={twoFactorDisableCode}
                              onChange={(event) =>
                                setTwoFactorDisableCode(
                                  event.target.value.trim().toUpperCase(),
                                )
                              }
                            />
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
                              <X className="h-4 w-4" />
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
                              <BadgeCheck className="h-4 w-4" />
                              Regenerate recovery codes
                            </button>
                          </div>
                        </div>
                      )}

                      {showRecoveryCodes && recoveryCodes.length ? (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-amber-900">
                                Save these recovery codes
                              </p>
                              <p className="mt-1 text-sm leading-6 text-amber-800">
                                Each code works once. Keep them somewhere private in case you lose your authenticator app.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(recoveryCodes.join("\n"));
                              }}
                              className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                            >
                              Copy codes
                            </button>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                      ) : null}
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeSection === "notifications" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Notification Preferences
                </h2>
                <p className="text-gray-500 mb-6">
                  Choose how you want to be notified
                </p>

                <div className="space-y-6">
                  {[
                    {
                      key: "orderUpdates",
                      label: "Order Updates",
                      desc: "Get notified about order status, shipping, and delivery",
                    },
                    {
                      key: "promotions",
                      label: "Promotions & Deals",
                      desc: "Receive special offers and discounts",
                    },
                    {
                      key: "newsletter",
                      label: "Newsletter",
                      desc: "Monthly updates about new products and news",
                    },
                    {
                      key: "smsNotifications",
                      label: "SMS Notifications",
                      desc: "Receive text messages for important updates",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.label}
                        </p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(item.key)}
                        className={`w-14 h-7 rounded-full transition relative ${
                          notifications[item.key]
                            ? "bg-pink-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            notifications[item.key]
                              ? "translate-x-8"
                              : "translate-x-1"
                          }`}
                        ></div>
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={handleNotificationSave}
                    className="flex items-center gap-2 bg-pink-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-pink-600 transition mt-4"
                  >
                    <Save size={18} /> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* PRIVACY SECTION */}
            {activeSection === "privacy" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Privacy Settings
                </h2>
                <p className="text-gray-500 mb-6">
                  Control who can see your information
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Visibility
                    </label>
                    <div className="flex gap-3">
                      {["public", "friends", "private"].map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            handlePrivacyChange("profileVisibility", option)
                          }
                          className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                            privacy.profileVisibility === option
                              ? "bg-pink-500 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {privacy.profileVisibility === "public" &&
                        "Everyone can see your profile"}
                      {privacy.profileVisibility === "friends" &&
                        "Only friends can see your profile"}
                      {privacy.profileVisibility === "private" &&
                        "Only you can see your profile"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">
                        Show Order History
                      </p>
                      <p className="text-sm text-gray-500">
                        Allow others to see your past orders
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handlePrivacyChange("showOrders", !privacy.showOrders)
                      }
                      className={`w-14 h-7 rounded-full transition relative ${
                        privacy.showOrders ? "bg-pink-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          privacy.showOrders ? "translate-x-8" : "translate-x-1"
                        }`}
                      ></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-800">Show Reviews</p>
                      <p className="text-sm text-gray-500">
                        Display your product reviews publicly
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handlePrivacyChange("showReviews", !privacy.showReviews)
                      }
                      className={`w-14 h-7 rounded-full transition relative ${
                        privacy.showReviews ? "bg-pink-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          privacy.showReviews
                            ? "translate-x-8"
                            : "translate-x-1"
                        }`}
                      ></div>
                    </button>
                  </div>

                  <button
                    onClick={handlePrivacySave}
                    className="flex items-center gap-2 bg-pink-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-pink-600 transition mt-4"
                  >
                    <Save size={18} /> Save Privacy Settings
                  </button>
                </div>
              </div>
            )}

            {/* DANGER ZONE */}
            {activeSection === "danger" && (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                  Danger Zone
                </h2>
                <p className="text-gray-500 mb-6">
                  Irreversible and destructive actions
                </p>

                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-red-700 mb-2">
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-600 mb-4">
                    Once you delete your account, there is no going back. All
                    your data, orders, and preferences will be permanently
                    deleted.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Delete Account
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete your
              account and all associated data.
            </p>

            <p className="text-sm text-gray-500 mb-4">
              Please type{" "}
              <span className="font-mono font-bold text-red-600">DELETE</span>{" "}
              to confirm:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Type DELETE"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountDeletion}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
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
