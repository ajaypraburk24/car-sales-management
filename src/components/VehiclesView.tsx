import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Upload,
  X,
  Car,
} from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCurrency } from '../lib/format.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { FuelType, TransmissionType, Vehicle, VehicleStatus } from '../types.ts';
import { Modal } from './ui/Modal.tsx';
import { StatusText } from './ui/StatusText.tsx';

const PRESET_GALLERY = [
  { label: 'Showroom Hero Sedan', url: '/src/assets/images/hero_showroom_vehicle_1794978283269.jpg' },
  { label: 'Obsidian Sport Sedan', url: '/src/assets/images/car_sedan_obsidian_1794978283395.jpg' },
  { label: 'Glacier Flagship SUV', url: '/src/assets/images/car_suv_glacier_1794978283684.jpg' },
  { label: 'Cobalt GT Coupe', url: '/src/assets/images/car_coupe_cobalt_1794978283899.jpg' },
  { label: 'Titanium EV Crossover', url: '/src/assets/images/car_ev_titanium_1794978284216.jpg' },
];

const INITIAL_FORM = {
  brand: '',
  model: '',
  variant: '',
  manufacturingYear: 2026,
  registrationNumber: '',
  fuelType: 'Petrol' as FuelType,
  transmission: 'Automatic' as TransmissionType,
  mileage: '',
  engineCapacity: '',
  colour: '',
  kilometresDriven: 0,
  exShowroomPrice: 0,
  sellingPrice: 0,
  stockQuantity: 1,
  description: '',
  status: 'Available' as VehicleStatus,
};

export function VehiclesView() {
  const { can, settings } = useAuth();
  const currency = settings?.currencySymbol || '₹';
  const canWrite = can('vehicles:write');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [fuelFilter, setFuelFilter] = useState<string>('All');

  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageUrls, setImageUrls] = useState<string[]>([PRESET_GALLERY[1].url]);
  const [customImageInput, setCustomImageInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Vehicle[]>('/api/vehicles');
      setVehicles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicle inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const brands = useMemo(() => {
    const unique = Array.from(new Set(vehicles.map((v) => v.brand).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [vehicles]);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        `${v.carCode} ${v.brand} ${v.model} ${v.variant} ${v.registrationNumber} ${v.colour} ${v.fuelType} ${v.transmission} ${v.manufacturingYear} ${v.description}`
          .toLowerCase()
          .includes(q);
      const matchesBrand = brandFilter === 'All' || v.brand === brandFilter;
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
      const matchesFuel = fuelFilter === 'All' || v.fuelType === fuelFilter;
      return matchesSearch && matchesBrand && matchesStatus && matchesFuel;
    });
  }, [vehicles, search, brandFilter, statusFilter, fuelFilter]);

  const hasActiveFilters =
    search.trim() !== '' || brandFilter !== 'All' || statusFilter !== 'All' || fuelFilter !== 'All';

  const resetFilters = () => {
    setSearch('');
    setBrandFilter('All');
    setStatusFilter('All');
    setFuelFilter('All');
  };

  const openCreate = () => {
    setEditingVehicle(null);
    setForm(INITIAL_FORM);
    setImageUrls([PRESET_GALLERY[1].url]);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      brand: v.brand,
      model: v.model,
      variant: v.variant,
      manufacturingYear: v.manufacturingYear,
      registrationNumber: v.registrationNumber,
      fuelType: v.fuelType,
      transmission: v.transmission,
      mileage: v.mileage,
      engineCapacity: v.engineCapacity,
      colour: v.colour,
      kilometresDriven: v.kilometresDriven,
      exShowroomPrice: v.exShowroomPrice,
      sellingPrice: v.sellingPrice,
      stockQuantity: v.stockQuantity,
      description: v.description,
      status: v.status,
    });
    setImageUrls(v.images?.map((i) => i.imageUrl) || [PRESET_GALLERY[0].url]);
    setError(null);
    setFormOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrls((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingVehicle) {
        await apiRequest(`/api/vehicles/${editingVehicle.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, images: imageUrls }),
        });
      } else {
        await apiRequest('/api/vehicles', {
          method: 'POST',
          body: JSON.stringify({ ...form, images: imageUrls }),
        });
      }
      setFormOpen(false);
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Unable to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: Vehicle) => {
    try {
      await apiRequest(`/api/vehicles/${v.id}`, { method: 'DELETE' });
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Cannot delete vehicle');
    }
  };

  const handleQuickStatus = async (v: Vehicle, status: VehicleStatus) => {
    try {
      await apiRequest(`/api/vehicles/${v.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await fetchVehicles();
      if (detailVehicle?.id === v.id) {
        setDetailVehicle((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-5">
      {/* Global Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Car ID, brand, model, reg #, colour, year..."
                aria-label="Search vehicles"
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              aria-label="Filter by brand"
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              aria-label="Filter by fuel type"
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Fuel Types</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
              <option value="CNG">CNG</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by availability status"
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500'
                }`}
                aria-label="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {canWrite && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Car</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="font-mono tabular-nums">
            Showing {filtered.length} of {vehicles.length} vehicles
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
          <Car className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h3 className="font-display text-base font-semibold">No matching vehicles found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {hasActiveFilters
              ? 'Try clearing or adjusting your brand, fuel type, or availability filters.'
              : 'Add your first vehicle to start tracking showroom inventory.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
              >
                Reset Filters
              </button>
            )}
            {canWrite && (
              <button
                type="button"
                onClick={openCreate}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
              >
                Add New Car
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((v) => {
            const primaryImg = v.images?.find((i) => i.isPrimary)?.imageUrl || v.images?.[0]?.imageUrl;
            return (
              <div
                key={v.id}
                className="group rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                  {primaryImg ? (
                    <img
                      src={primaryImg}
                      alt={`${v.brand} ${v.model}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-400">
                      <Car className="w-8 h-8 mb-1" />
                      <span className="text-xs">{v.brand} {v.model}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
                    <span className="font-mono text-[11px] text-slate-200">{v.carCode}</span>
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      {formatCurrency(v.sellingPrice, currency)}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white leading-snug">
                        {v.brand} {v.model}
                      </h3>
                      <StatusText status={v.status} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {v.variant} · {v.manufacturingYear}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <span>{v.fuelType}</span>
                      <span aria-hidden="true">·</span>
                      <span>{v.transmission}</span>
                      <span aria-hidden="true">·</span>
                      <span>{v.colour}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Stock: {v.stockQuantity}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailVehicle(v);
                        setActiveImgIndex(0);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Specs</span>
                    </button>

                    {canWrite && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Vehicle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Car ID</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Reg #</th>
                  <th className="py-3 px-4">Powertrain</th>
                  <th className="py-3 px-4 text-right">Stock</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {v.carCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {v.brand} {v.model}
                      </div>
                      <div className="text-[11px] text-slate-500">{v.variant} · {v.manufacturingYear}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {v.registrationNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {v.fuelType} · {v.transmission}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{v.stockQuantity}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                      {formatCurrency(v.sellingPrice, currency)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusText status={v.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailVehicle(v);
                          setActiveImgIndex(0);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(v)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(v)}
                            className="p-1.5 text-slate-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle Detail Modal */}
      <Modal
        open={!!detailVehicle}
        onClose={() => setDetailVehicle(null)}
        title={detailVehicle ? `${detailVehicle.brand} ${detailVehicle.model}` : ''}
        subtitle={detailVehicle ? `${detailVehicle.carCode} · ${detailVehicle.variant}` : ''}
        maxWidthClass="max-w-3xl"
      >
        {detailVehicle && (
          <div className="space-y-6">
            <div className="space-y-2.5">
              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800">
                <img
                  src={detailVehicle.images?.[activeImgIndex]?.imageUrl || PRESET_GALLERY[0].url}
                  alt={`${detailVehicle.brand} ${detailVehicle.model}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              {detailVehicle.images && detailVehicle.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {detailVehicle.images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImgIndex(idx)}
                      className={`w-20 h-14 rounded-md overflow-hidden border-2 shrink-0 ${
                        idx === activeImgIndex ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.imageUrl} alt={img.caption} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[11px] text-slate-500">Ex-Showroom Price</div>
                <div className="font-mono text-sm font-semibold tabular-nums mt-0.5">
                  {formatCurrency(detailVehicle.exShowroomPrice, currency)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Selling Price</div>
                <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
                  {formatCurrency(detailVehicle.sellingPrice, currency)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Stock Quantity</div>
                <div className="font-mono text-sm font-semibold tabular-nums mt-0.5">
                  {detailVehicle.stockQuantity} unit(s)
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Availability</div>
                <div className="mt-0.5">
                  <StatusText status={detailVehicle.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
              <div><span className="text-slate-500 block">Registration #</span><span className="font-mono font-medium">{detailVehicle.registrationNumber}</span></div>
              <div><span className="text-slate-500 block">Model Year</span><span className="font-mono font-medium">{detailVehicle.manufacturingYear}</span></div>
              <div><span className="text-slate-500 block">Fuel Type</span><span className="font-medium">{detailVehicle.fuelType}</span></div>
              <div><span className="text-slate-500 block">Transmission</span><span className="font-medium">{detailVehicle.transmission}</span></div>
              <div><span className="text-slate-500 block">Engine / Battery</span><span className="font-medium">{detailVehicle.engineCapacity}</span></div>
              <div><span className="text-slate-500 block">Mileage / Range</span><span className="font-medium">{detailVehicle.mileage}</span></div>
              <div><span className="text-slate-500 block">Colour</span><span className="font-medium">{detailVehicle.colour}</span></div>
              <div><span className="text-slate-500 block">Odometer</span><span className="font-mono font-medium tabular-nums">{detailVehicle.kilometresDriven.toLocaleString('en-IN')} km</span></div>
            </div>

            {detailVehicle.description && (
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-3 border-t border-slate-200 dark:border-slate-800">
                {detailVehicle.description}
              </div>
            )}

            {canWrite && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Update Status:</span>
                  {(['Available', 'Reserved', 'Sold', 'Under Maintenance'] as VehicleStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleQuickStatus(detailVehicle, st)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        detailVehicle.status === st
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add / Edit Vehicle Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingVehicle ? `Edit Vehicle · ${editingVehicle.carCode}` : 'Add New Vehicle to Inventory'}
        subtitle="Complete technical specifications, pricing, and multi-angle imagery"
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Brand *</label>
              <input
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g., Mercedes-Benz"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Model *</label>
              <input
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g., S-Class"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Variant</label>
              <input
                value={form.variant}
                onChange={(e) => setForm({ ...form, variant: e.target.value })}
                placeholder="e.g., S 450 4MATIC"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Manufacturing Year</label>
              <input
                type="number"
                value={form.manufacturingYear}
                onChange={(e) => setForm({ ...form, manufacturingYear: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Registration Number</label>
              <input
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                placeholder="MH-01-XX-0001"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Colour</label>
              <input
                value={form.colour}
                onChange={(e) => setForm({ ...form, colour: e.target.value })}
                placeholder="Obsidian Black"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Fuel Type</label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value as FuelType })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Transmission</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value as TransmissionType })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="DCT">DCT</option>
                <option value="CVT">CVT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Engine Capacity</label>
              <input
                value={form.engineCapacity}
                onChange={(e) => setForm({ ...form, engineCapacity: e.target.value })}
                placeholder="2999 cc / 93 kWh"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Mileage / Range</label>
              <input
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                placeholder="14.2 km/l"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Kilometres Driven</label>
              <input
                type="number"
                value={form.kilometresDriven}
                onChange={(e) => setForm({ ...form, kilometresDriven: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Availability Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ex-Showroom Price ({currency})</label>
              <input
                type="number"
                required
                value={form.exShowroomPrice}
                onChange={(e) => setForm({ ...form, exShowroomPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Selling Price ({currency}) *</label>
              <input
                type="number"
                required
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Stock Quantity</label>
              <input
                type="number"
                min={0}
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Vehicle Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Key trim packages, interior leather, warranty details..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Multi-Image Manager */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-medium">Vehicle Gallery ({imageUrls.length} images)</label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Multiple Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_GALLERY.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => {
                    if (!imageUrls.includes(preset.url)) setImageUrls((prev) => [...prev, preset.url]);
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customImageInput}
                onChange={(e) => setCustomImageInput(e.target.value)}
                placeholder="Or paste image URL..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
              <button
                type="button"
                onClick={() => {
                  if (customImageInput.trim()) {
                    setImageUrls((prev) => [...prev, customImageInput.trim()]);
                    setCustomImageInput('');
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-slate-800 text-white"
              >
                Add URL
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img src={url} alt={`Vehicle upload ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-[10px] text-white font-medium">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
