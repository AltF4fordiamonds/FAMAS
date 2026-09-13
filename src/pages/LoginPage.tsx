import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Truck,
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  Database,
  Briefcase,
  Car,
  Award,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { UserRole, DriverStatus, Vehicle } from '../types.js';

export const LoginPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('driver');

  // Driver-specific fields matching the driver profile modal
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDriverEmail, setRegDriverEmail] = useState('');
  const [regLicense, setRegLicense] = useState('C+E');
  const [regExperienceYears, setRegExperienceYears] = useState<number>(5);
  const [regStatus, setRegStatus] = useState<DriverStatus>('available');
  const [regAssignedVehicle, setRegAssignedVehicle] = useState<string>('');

  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

  // Fetch available vehicles on mount for driver registration dropdown
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/auth/vehicles');
        if (res.data?.vehicles) {
          setAvailableVehicles(res.data.vehicles);
        }
      } catch (err) {
        console.warn('Could not load vehicles for registration', err);
      }
    };
    fetchVehicles();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      setError('Моля, въведете вашия имейл адрес');
      return;
    }
    if (!passwordInput) {
      setError('Моля, въведете парола');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(loginInput.trim(), passwordInput);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Неуспешен вход. Моля проверете вашите данни.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveEmail = (regRole === 'driver' && regDriverEmail.trim()) ? regDriverEmail.trim() : regEmail.trim();

    if (!regUsername.trim() || !effectiveEmail || !regPassword) {
      setError('Моля, попълнете всички задължителни полета за регистрация');
      return;
    }

    if (regRole === 'driver') {
      if (!regFirstName.trim() || !regLastName.trim() || !regPhone.trim()) {
        setError('Моля, попълнете задължителните полета за шофьора (First Name, Last Name, Phone Number)');
        return;
      }
    }

    if (regPassword.length < 6) {
      setError('Паролата трябва да бъде поне 6 символа');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      await register({
        username: regUsername.trim(),
        email: effectiveEmail,
        password: regPassword,
        role: regRole,
        firstName: regFirstName.trim() || regUsername.trim(),
        lastName: regLastName.trim() || 'Driver',
        phone: regPhone.trim() || '+1 555-0192',
        licenseCategory: regLicense,
        experienceYears: Number(regExperienceYears) >= 0 ? Number(regExperienceYears) : 5,
        status: regStatus,
        assignedVehicle: regAssignedVehicle || undefined,
      });

      setSuccessMsg('Профилът на шофьора е създаден успешно и запазен в базата данни!');
      setTimeout(() => {
        navigate(regRole === 'driver' ? '/trips' : '/');
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Грешка при регистрация. Проверете дали потребителят не съществува вече.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      await demoLogin(role);
      navigate(role === 'driver' ? '/trips' : '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/20 mb-4">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">FAMAS</h2>
        <p className="mt-1 text-sm text-slate-400">Fleet Administration &amp; Management Automation System</p>
      </div>

      <div className={`mt-8 sm:mx-auto sm:w-full px-4 transition-all duration-300 ${activeTab === 'register' && regRole === 'driver' ? 'sm:max-w-xl' : 'sm:max-w-md'}`}>
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-8 border border-slate-100">
          
          {/* Tabs: Sign In / Register */}
          <div className="flex border-b border-slate-200 mb-6" id="auth-mode-tabs">
            <button
              type="button"
              id="tab-btn-login"
              onClick={() => {
                setActiveTab('login');
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'login'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Вход в системата
            </button>
            <button
              type="button"
              id="tab-btn-register"
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Регистрация</span>
            </button>
          </div>

          {isExpired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Сесията ви е изтекла. Моля, влезте отново.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Имейл адрес
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="login-email-input"
                    autoComplete="email"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="admin@fleet.com"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Парола
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    id="login-password-input"
                    autoComplete="current-password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Автентикация...</span>
                ) : (
                  <>
                    <span>Вход в системата</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Нямате акаунт? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError(null);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Регистрирайте се тук
                </button>
              </div>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" id="register-form">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Роля в автопарка
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('driver')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      regRole === 'driver'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Шофьор (Driver)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('dispatcher')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      regRole === 'dispatcher'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Диспечер</span>
                  </button>
                </div>
              </div>

              {regRole === 'driver' ? (
                /* Driver Profile Section - Exactly matches Add New Driver Profile modal */
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Driver Profile Details / Данни за шофьора
                    </span>
                  </div>

                  {/* Row 1: First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="reg-first-name"
                        required
                        value={regFirstName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRegFirstName(val);
                          if (!regUsername || regUsername === `${regFirstName.toLowerCase()}_${regLastName.toLowerCase()}`.replace(/^_|_$/, '')) {
                            setRegUsername(`${val.toLowerCase().trim()}_${regLastName.toLowerCase().trim()}`.replace(/^_|_$/, ''));
                          }
                        }}
                        placeholder="John"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="reg-last-name"
                        required
                        value={regLastName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRegLastName(val);
                          if (!regUsername || regUsername === `${regFirstName.toLowerCase()}_${regLastName.toLowerCase()}`.replace(/^_|_$/, '')) {
                            setRegUsername(`${regFirstName.toLowerCase().trim()}_${val.toLowerCase().trim()}`.replace(/^_|_$/, ''));
                          }
                        }}
                        placeholder="Doe"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone Number & Email Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="reg-phone"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+1 555-0192"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="reg-email"
                        required
                        value={regDriverEmail || regEmail}
                        onChange={(e) => {
                          setRegDriverEmail(e.target.value);
                          setRegEmail(e.target.value);
                        }}
                        placeholder="driver@fleet.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 3: License Category & Experience (Years) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        License Category *
                      </label>
                      <select
                        id="reg-license"
                        value={regLicense}
                        onChange={(e) => setRegLicense(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="C+E">Category C+E (Articulated Truck)</option>
                        <option value="C">Category C (Rigid Truck &gt; 3.5t)</option>
                        <option value="B">Category B (Light Commercial)</option>
                        <option value="D">Category D (Passenger Bus)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        id="reg-experience"
                        min={0}
                        max={60}
                        value={regExperienceYears}
                        onChange={(e) => setRegExperienceYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        placeholder="5"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 4: Availability Status & Assigned Vehicle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Availability Status
                      </label>
                      <select
                        id="reg-status"
                        value={regStatus}
                        onChange={(e) => setRegStatus(e.target.value as DriverStatus)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="available">Available</option>
                        <option value="assigned">Assigned</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Assigned Vehicle
                      </label>
                      <select
                        id="reg-assigned-vehicle"
                        value={regAssignedVehicle}
                        onChange={(e) => {
                          const vId = e.target.value;
                          setRegAssignedVehicle(vId);
                          if (vId) {
                            setRegStatus('assigned');
                          } else if (regStatus === 'assigned') {
                            setRegStatus('available');
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="">None (Unassigned)</option>
                        {availableVehicles.map((v) => (
                          <option key={v._id} value={v._id}>
                            {v.registrationNumber} — {v.make} {v.model} ({v.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Credentials Section for Logging In */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Данни за достъп в системата (System Credentials)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Username *
                        </label>
                        <input
                          type="text"
                          id="reg-username-input"
                          required
                          minLength={3}
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="john_doe"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          id="reg-password-input"
                          required
                          minLength={6}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Dispatcher Registration */
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Потребителско име *
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="reg-dispatcher-username"
                        required
                        minLength={3}
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="dispatcher_user"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Имейл адрес *
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="reg-dispatcher-email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="dispatcher@fleet.com"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Парола (мин. 6 символа) *
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        id="reg-dispatcher-password"
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Persistence Notice */}
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2 text-[11px] text-blue-900">
                <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Мутация на базата данни:</strong> Новият потребител се запазва автоматично в MongoDB с персистентен диск-снапшот и остава наличен при всяко стартиране.
                </span>
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Създаване на профил...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Създай профил и влез</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Вече имате профил? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                >
                  Влезте оттук
                </button>
              </div>
            </form>
          )}

          {/* Quick Oral Defense Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center mb-3">
              Oral Defense Quick Access
            </p>
            <div className="space-y-2">
              <button
                type="button"
                id="quick-login-admin"
                disabled={loading}
                onClick={() => handleQuickLogin('admin')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors group disabled:opacity-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800">Administrator</span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded-sm">
                      Full Access
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">admin@fleet.com (admin123)</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
              </button>

              <button
                type="button"
                id="quick-login-dispatcher"
                disabled={loading}
                onClick={() => handleQuickLogin('dispatcher')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors group disabled:opacity-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800">Dispatcher</span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.2 rounded-sm">
                      Trips &amp; Fleet
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">dispatcher@fleet.com (dispatch123)</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
              </button>

              <button
                type="button"
                id="quick-login-driver"
                disabled={loading}
                onClick={() => handleQuickLogin('driver')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors group disabled:opacity-50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-800">Driver (John Davis)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-sm">
                      My Trips Only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">driver.john@fleet.com (driver123)</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

