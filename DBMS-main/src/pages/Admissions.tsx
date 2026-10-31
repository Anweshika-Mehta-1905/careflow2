import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';
import {
  Bed,
  BedDouble,
  UserPlus,
  Stethoscope,
  LogOut,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchInput } from '../components/ui/SearchInput';

type Admission = Database['public']['Tables']['admissions']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];
type Doctor = Database['public']['Tables']['doctors']['Row'];
type BedRow = Database['public']['Tables']['rooms_beds']['Row'];

export default function Admissions() {
  const [admissions, setAdmissions] = useState<(Admission & { patients: Patient; doctors: Doctor; rooms_beds: BedRow })[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [beds, setBeds] = useState<BedRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmitOpen, setIsAdmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Discharged'>('All');

  const [dischargeTarget, setDischargeTarget] = useState<number | null>(null);
  const [isDischarging, setIsDischarging] = useState(false);

  const [newAdmission, setNewAdmission] = useState({
    patient_id: '',
    bed_id: '',
    doctor_id: '',
    notes: '',
  });

  const fetchData = async () => {
    const [admRes, patRes, docRes, bedRes] = await Promise.all([
      supabase
        .from('admissions')
        .select(`
          *,
          patients (*),
          doctors (*),
          rooms_beds (*)
        `)
        .order('admission_date', { ascending: false }),
      supabase.from('patients').select('*'),
      supabase.from('doctors').select('*'),
      supabase.from('rooms_beds').select('*').eq('status', 'Vacant'),
    ]);

    if (admRes.error) toast.error('Failed to load admissions');
    else setAdmissions((admRes.data as any) || []);

    if (patRes.error) toast.error('Failed to load patients');
    else setPatients(patRes.data || []);

    if (docRes.error) toast.error('Failed to load doctors');
    else setDoctors(docRes.data || []);

    if (bedRes.error) toast.error('Failed to load available beds');
    else setBeds(bedRes.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmission.patient_id || !newAdmission.bed_id || !newAdmission.doctor_id) {
      toast.error('Patient, bed, and doctor are required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('admissions').insert([
      {
        patient_id: parseInt(newAdmission.patient_id, 10),
        bed_id: parseInt(newAdmission.bed_id, 10),
        doctor_id: parseInt(newAdmission.doctor_id, 10),
        notes: newAdmission.notes ? newAdmission.notes.trim() : null,
      },
    ]);

    if (error) {
      toast.error('Error admitting patient: ' + error.message);
    } else {
      toast.success('Patient admitted');
      setNewAdmission({ patient_id: '', bed_id: '', doctor_id: '', notes: '' });
      setIsAdmitOpen(false);
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDischargeConfirm = async () => {
    if (!dischargeTarget) return;

    setIsDischarging(true);
    const { error } = await supabase.rpc('discharge_patient', {
      p_admission_id: dischargeTarget,
    });

    if (error) {
      toast.error('Discharge failed: ' + error.message);
    } else {
      toast.success('Patient discharged and invoice generated');
      setDischargeTarget(null);
      fetchData();
    }
    setIsDischarging(false);
  };

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const pName = `${adm.patients?.first_name || ''} ${adm.patients?.last_name || ''}`.toLowerCase();
      const room = `${adm.rooms_beds?.room_no || ''}`.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || pName.includes(q) || room.includes(q);

      const isActive = !adm.discharge_date;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && isActive) ||
        (statusFilter === 'Discharged' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [admissions, searchQuery, statusFilter]);

  const vacantCounts = useMemo(() => {
    const icu = beds.filter((b) => b.ward_type === 'ICU').length;
    const general = beds.filter((b) => b.ward_type === 'General').length;
    const priv = beds.filter((b) => b.ward_type === 'Private').length;
    return { icu, general, priv, total: beds.length };
  }, [beds]);

  return (
    <PageContainer>
      <PageHeader
        title="Admissions & Beds"
        badge={
          <Badge variant="neutral" size="sm">
            {admissions.filter((a) => !a.discharge_date).length} Active
          </Badge>
        }
      >
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsAdmitOpen(true)}
        >
          Admit Patient
        </Button>
      </PageHeader>

      {/* Available Beds Status Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Total Vacant</span>
            <Bed className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{vacantCounts.total}</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>General Ward</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{vacantCounts.general}</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>ICU</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{vacantCounts.icu}</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Private</span>
            <span className="w-2 h-2 rounded-full bg-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{vacantCounts.priv}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by patient or room..."
            className="w-full sm:max-w-xs"
          />

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            {(['All', 'Active', 'Discharged'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          {filteredAdmissions.length} of {admissions.length} records
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Admission Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <LoadingState message="Loading..." />
                  </td>
                </tr>
              ) : filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={BedDouble}
                      title="No admissions found"
                      description="No records match your criteria."
                      actionText={searchQuery || statusFilter !== 'All' ? 'Clear Filters' : 'Admit Patient'}
                      onAction={() => {
                        if (searchQuery || statusFilter !== 'All') {
                          setSearchQuery('');
                          setStatusFilter('All');
                        } else {
                          setIsAdmitOpen(true);
                        }
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredAdmissions.map((adm) => {
                  const isActive = !adm.discharge_date;

                  return (
                    <tr key={adm.admission_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        #{adm.admission_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {adm.patients?.first_name} {adm.patients?.last_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        Room {adm.rooms_beds?.room_no} ({adm.rooms_beds?.ward_type})
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Dr. {adm.doctors?.first_name} {adm.doctors?.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {new Date(adm.admission_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {isActive ? (
                          <Badge variant="success" size="sm" dot>
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Discharged
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isActive ? (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<LogOut className="w-3.5 h-3.5" />}
                            onClick={() => setDischargeTarget(adm.admission_id)}
                          >
                            Discharge
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admit Patient Modal */}
      <Modal
        isOpen={isAdmitOpen}
        onClose={() => setIsAdmitOpen(false)}
        title="Admit Patient"
        maxWidth="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Patient"
              required
              value={newAdmission.patient_id}
              onChange={(e) => setNewAdmission({ ...newAdmission, patient_id: e.target.value })}
            >
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </Select>

            <Select
              label="Doctor"
              required
              value={newAdmission.doctor_id}
              onChange={(e) => setNewAdmission({ ...newAdmission, doctor_id: e.target.value })}
            >
              <option value="">Select doctor...</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  Dr. {d.first_name} {d.last_name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Room / Bed"
              required
              value={newAdmission.bed_id}
              onChange={(e) => setNewAdmission({ ...newAdmission, bed_id: e.target.value })}
            >
              <option value="">Select available bed...</option>
              {beds.map((b) => (
                <option key={b.bed_id} value={b.bed_id}>
                  Room {b.room_no} • {b.ward_type} (${b.daily_rate}/day)
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              label="Clinical Notes"
              type="text"
              placeholder="Diagnosis / admission notes (optional)"
              value={newAdmission.notes}
              onChange={(e) => setNewAdmission({ ...newAdmission, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdmitOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={beds.length === 0}
            >
              Admit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discharge Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dischargeTarget !== null}
        onClose={() => setDischargeTarget(null)}
        onConfirm={handleDischargeConfirm}
        title="Discharge Patient"
        description="Are you sure you want to discharge this patient? This will generate their final bill and release the bed."
        confirmText="Confirm Discharge"
        cancelText="Cancel"
        variant="warning"
        isLoading={isDischarging}
      />
    </PageContainer>
  );
}
