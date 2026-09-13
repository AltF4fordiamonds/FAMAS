import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Calendar,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Vehicle, VehicleStatus, FuelType } from '../types.js';
import { StatusBadge, PlateBadge } from '../components/StatusBadge.js';

export const VehiclesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Vehicle | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form state
  const defaultForm = {
    make: '',
    model: '',
    registrationNumber: '',
    year: new Date().getFullYear(),
    status: 'available' as VehicleStatus,
    fuelType: 'diesel' as FuelType,
    fuelConsumption: 28.5,
    currentMileage: 0,
    technicalInspectionDate: '',
    insuranceDate: '',
    insuranceProvider: 'Allianz Heavy Transport',
    insurancePolicyNumber: '',
  };
  const [formData, setFormData] = useState(defaultForm);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/vehicles', {
        params: {
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          fuelType: fuelFilter !== 'all' ? fuelFilter : undefined,
        },
      });
      setVehicles(res.data.vehicles || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load fleet vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, fuelFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles();
  };

  const openAddModal = () => {
    setFormData(defaultForm);
    setModalError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      make: v.make,
      model: v.model,
      registrationNumber: v.registrationNumber,
      year: v.year,
      status: v.status,
      fuelType: v.fuelType,
      fuelConsumption: v.fuelConsumption,
      currentMileage: v.currentMileage,
      technicalInspectionDate: v.technicalInspection?.validUntil
        ? new Date(v.technicalInspection.validUntil).toISOString().split('T')[0]
        : '',
      insuranceDate: v.insurance?.validUntil
        ? new Date(v.insurance.validUntil).toISOString().split('T')[0]
        : '',
      insuranceProvider: v.insurance?.provider || '',
      insurancePolicyNumber: v.insurance?.policyNumber || '',
    });
    setModalError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    const payload = {
      make: formData.make,
      model: formData.model,
      registrationNumber: formData.registrationNumber.toUpperCase().trim(),
      year: Number(formData.year),
      status: formData.status,
      fuelType: formData.fuelType,
      fuelConsumption: Number(formData.fuelConsumption),
      currentMileage: Number(formData.currentMileage),
      technicalInspection: {
        validUntil: formData.technicalInspectionDate,
      },
      insurance: {
        validUntil: formData.insuranceDate,
        provider: formData.insuranceProvider,
        policyNumber: formData.insurancePolicyNumber,
      },
    };

    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle._id}`, payload);
        setEditingVehicle(null);
      } else {
        await api.post('/vehicles', payload);
        setIsAddModalOpen(false);
      }
      fetchVehicles();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to save vehicle details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await api.delete(`/vehicles/${deleteCandidate._id}`);
      setDeleteCandidate(null);
      fetchVehicles();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to delete vehicle');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fleet Vehicles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete inventory of transport trucks, vans, and commercial vehicles.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search make, model, or license plate..."
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
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Fuels</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="gasoline">Gasoline</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Vehicle Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-5 py-3">Vehicle Details</th>
                <th className="px-4 py-3">Registration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Technical Inspection</th>
                <th className="px-4 py-3">Insurance Policy</th>
                <th className="px-4 py-3">Assigned Driver</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Loading fleet records...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No vehicles found matching your criteria.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {v.make} {v.model}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {v.year} • {v.fuelType} • {v.currentMileage.toLocaleString()} km
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <PlateBadge plate={v.registrationNumber} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={v.status} type="vehicle" />
                    </td>
                    <td className="px-4 py-3.5">
                      {v.inspectionStatus && (
                        <StatusBadge
                          status={v.inspectionStatus.status}
                          type="doc"
                          daysRemaining={v.inspectionStatus.daysRemaining}
                        />
                      )}
                      <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                        {v.technicalInspection?.validUntil
                          ? new Date(v.technicalInspection.validUntil).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {v.insuranceStatus && (
                        <StatusBadge
                          status={v.insuranceStatus.status}
                          type="doc"
                          daysRemaining={v.insuranceStatus.daysRemaining}
                        />
                      )}
                      <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                        {v.insurance?.provider || 'Insured'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {v.assignedDriver ? (
                        <span className="font-medium text-slate-800">
                          {v.assignedDriver.firstName} {v.assignedDriver.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/vehicles/${v._id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="View Details and Repairs"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(v)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors"
                              title="Edit Vehicle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteCandidate(v);
                                setModalError(null);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                              title="Delete Vehicle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {(isAddModalOpen || editingVehicle) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingVehicle ? `Edit Vehicle: ${editingVehicle.registrationNumber}` : 'Register New Fleet Vehicle'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingVehicle(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Make *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Volvo, Mercedes-Benz, Scania..."
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FH16, Actros 1845, TGX..."
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Registration Plate *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FL-9201-TR"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Manufacturing Year *
                  </label>
                  <input
                    type="number"
                    required
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Operational Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="gasoline">Gasoline</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="cng">CNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Current Mileage (km)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.currentMileage}
                    onChange={(e) => setFormData({ ...formData, currentMileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Avg Fuel Consumption (L/100km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={formData.fuelConsumption}
                    onChange={(e) => setFormData({ ...formData, fuelConsumption: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Document Expiration Dates Section */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Document Expiration Dates & Compliance
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Technical Inspection Expiration *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.technicalInspectionDate}
                      onChange={(e) => setFormData({ ...formData, technicalInspectionDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Insurance Policy Expiration *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.insuranceDate}
                      onChange={(e) => setFormData({ ...formData, insuranceDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      placeholder="Allianz, Zurich, AXA..."
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Insurance Policy Number
                    </label>
                    <input
                      type="text"
                      placeholder="POL-99210-EU"
                      value={formData.insurancePolicyNumber}
                      onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingVehicle(null);
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
                  {modalLoading ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Integrity Alert */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Delete Fleet Vehicle</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">
                {deleteCandidate.make} {deleteCandidate.model} ({deleteCandidate.registrationNumber})
              </strong>
              ? All historical maintenance records will also be removed.
            </p>

            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
              <strong>Integrity Guard:</strong> The system will automatically verify that this vehicle has no active or planned trips.
            </div>

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
