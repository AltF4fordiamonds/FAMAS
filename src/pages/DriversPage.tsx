import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  Truck,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Award,
  Link as LinkIcon,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Driver, DriverStatus, Vehicle } from '../types.js';
import { StatusBadge, PlateBadge } from '../components/StatusBadge.js';

export const DriversPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDispatcher = user?.role === 'dispatcher';
  const canManage = isAdmin || isDispatcher;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [licenseFilter, setLicenseFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<Driver | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Driver | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form
  const defaultForm = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    licenseCategory: 'C+E',
    experienceYears: 5,
    status: 'available' as DriverStatus,
    assignedVehicleId: '',
  };
  const [formData, setFormData] = useState(defaultForm);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/drivers', {
        params: {
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          licenseCategory: licenseFilter !== 'all' ? licenseFilter : undefined,
        },
      });
      setDrivers(res.data.drivers || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiclesList = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      console.error('Failed to load vehicles for assignment', err);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchVehiclesList();
  }, [statusFilter, licenseFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDrivers();
  };

  const openEditModal = (d: Driver) => {
    setEditingDriver(d);
    setFormData({
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      email: d.email,
      licenseCategory: d.licenseCategory,
      experienceYears: d.experienceYears,
      status: d.status,
      assignedVehicleId: d.assignedVehicle?._id || '',
    });
    setModalError(null);
  };

  const openAssignModal = (d: Driver) => {
    setAssigningDriver(d);
    setSelectedVehicleId(d.assignedVehicle?._id || '');
    setModalError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    setModalLoading(true);
    setModalError(null);

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      licenseCategory: formData.licenseCategory,
      experienceYears: Number(formData.experienceYears),
      status: formData.status,
      assignedVehicle: formData.assignedVehicleId || null,
    };

    try {
      await api.put(`/drivers/${editingDriver._id}`, payload);
      setEditingDriver(null);
      fetchDrivers();
      fetchVehiclesList();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to save driver');
    } finally {
      setModalLoading(false);
    }
  };

  const handleVehicleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningDriver) return;
    setModalLoading(true);
    setModalError(null);

    try {
      await api.put(`/drivers/${assigningDriver._id}`, {
        assignedVehicle: selectedVehicleId || null,
        status: selectedVehicleId ? 'assigned' : 'available',
      });
      setAssigningDriver(null);
      fetchDrivers();
      fetchVehiclesList();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to update vehicle assignment');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await api.delete(`/drivers/${deleteCandidate._id}`);
      setDeleteCandidate(null);
      fetchDrivers();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to delete driver');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Driver Personnel</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage transport operators, license qualifications, and vehicle assignments.
          </p>
        </div>

        {/* Drivers register independently via public sign-up page */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium self-start sm:self-auto">
          <Truck className="w-3.5 h-3.5 text-blue-600" />
          <span>Drivers register via Sign Up</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search driver name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Licenses</option>
            <option value="B">Cat B (Light Van)</option>
            <option value="C">Cat C (Rigid Truck)</option>
            <option value="C+E">Cat C+E (Articulated)</option>
            <option value="D">Cat D (Passenger/Bus)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Driver Cards / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-5 py-3">Driver Name & Experience</th>
                <th className="px-4 py-3">License Category</th>
                <th className="px-4 py-3">Contact Information</th>
                <th className="px-4 py-3">Assigned Vehicle</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading driver rosters...
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {d.firstName[0]}
                          {d.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {d.firstName} {d.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-600" />
                            {d.experienceYears} years commercial experience
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-xs text-slate-800">
                        {d.licenseCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{d.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{d.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {d.assignedVehicle ? (
                        <div className="flex items-center gap-2">
                          <PlateBadge plate={d.assignedVehicle.registrationNumber} />
                          <span className="text-[11px] font-medium text-slate-700">
                            {d.assignedVehicle.make} {d.assignedVehicle.model}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={d.status} type="driver" />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openAssignModal(d)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Assign / Reassign Vehicle"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(d)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit Driver Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setDeleteCandidate(d);
                                setModalError(null);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                              title="Delete Driver"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Driver Modal */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Edit Driver Profile: {editingDriver.firstName} {editingDriver.lastName}
              </h3>
              <button
                onClick={() => {
                  setEditingDriver(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 555-0192"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="driver@fleet.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    License Category *
                  </label>
                  <select
                    value={formData.licenseCategory}
                    onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="B">Category B (Light Commercial)</option>
                    <option value="C">Category C (Rigid Truck &gt; 3.5t)</option>
                    <option value="C+E">Category C+E (Articulated Truck)</option>
                    <option value="D">Category D (Passenger Bus)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Availability Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as DriverStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
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
                    value={formData.assignedVehicleId}
                    onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="">None (Unassigned)</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} — {v.make} {v.model} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDriver(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Update Driver Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Vehicle Assignment Modal */}
      {assigningDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Vehicle Assignment: {assigningDriver.firstName} {assigningDriver.lastName}
              </h3>
              <button onClick={() => setAssigningDriver(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleVehicleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Fleet Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="">No Vehicle Assigned (Driver is Available)</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} — {v.make} {v.model} ({v.status})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Assigning a vehicle automatically updates the driver and vehicle status.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningDriver(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Delete Driver Record</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove{' '}
              <strong className="text-slate-900">
                {deleteCandidate.firstName} {deleteCandidate.lastName}
              </strong>
              ? If currently assigned to a vehicle, the vehicle will be unassigned.
            </p>

            {modalError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {modalError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={modalLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
              >
                {modalLoading ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
