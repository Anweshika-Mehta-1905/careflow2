import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';
import {
  Calendar,
  CalendarPlus,
  Clock,
  Stethoscope,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchInput } from '../components/ui/SearchInput';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type Doctor = Database['public']['Tables']['doctors']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

export default function Appointments() {
  const [appointments, setAppointments] = useState<(Appointment & { doctors: Doctor; patients: Patient })[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');

  const [newAppt, setNewAppt] = useState({
    patient_id: '',
    doctor_id: '',
    appt_date: '',
    time_slot: '',
  });

  const fetchData = async () => {
    const [appRes, docRes, patRes] = await Promise.all([
      supabase
        .from('appointments')
        .select(`
          *,
          doctors (*),
          patients (*)
        `)
        .order('appt_date', { ascending: false }),
      supabase.from('doctors').select('*'),
      supabase.from('patients').select('*'),
    ]);

    if (appRes.error) toast.error('Failed to load appointments');
    else setAppointments((appRes.data as any) || []);

    if (docRes.error) toast.error('Failed to load doctors');
    else setDoctors(docRes.data || []);

    if (patRes.error) toast.error('Failed to load patients');
    else setPatients(patRes.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.patient_id || !newAppt.doctor_id || !newAppt.appt_date || !newAppt.time_slot) {
      toast.error('All appointment fields are required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('appointments').insert([
      {
        patient_id: parseInt(newAppt.patient_id, 10),
        doctor_id: parseInt(newAppt.doctor_id, 10),
        appt_date: newAppt.appt_date,
        time_slot: newAppt.time_slot,
      },
    ]);

    if (error) {
      if (error.code === '23505' || error.message.includes('uq_doctor_slot')) {
        toast.error('This doctor is already booked for this time slot.');
      } else {
        toast.error('Error booking appointment: ' + error.message);
      }
    } else {
      toast.success('Appointment scheduled');
      setNewAppt({ patient_id: '', doctor_id: '', appt_date: '', time_slot: '' });
      setIsBookOpen(false);
      fetchData();
    }
    setIsSubmitting(false);
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const pName = `${app.patients?.first_name || ''} ${app.patients?.last_name || ''}`.toLowerCase();
      const dName = `${app.doctors?.first_name || ''} ${app.doctors?.last_name || ''}`.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || pName.includes(q) || dName.includes(q) || app.time_slot.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'Cancelled':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      case 'Scheduled':
      default:
        return <Badge variant="info" size="sm" dot>Scheduled</Badge>;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Appointments"
        badge={
          <Badge variant="neutral" size="sm">
            {appointments.length} Total
          </Badge>
        }
      >
        <Button
          variant="primary"
          size="sm"
          leftIcon={<CalendarPlus className="w-4 h-4" />}
          onClick={() => setIsBookOpen(true)}
        >
          Book Appointment
        </Button>
      </PageHeader>

      {/* Filter and Search Controls */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by patient or doctor..."
            className="w-full sm:max-w-xs"
          />

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            {(['All', 'Scheduled', 'Completed', 'Cancelled'] as const).map((tab) => (
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
          {filteredAppointments.length} of {appointments.length} records
        </div>
      </div>

      {/* Appointment Table */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <LoadingState message="Loading..." />
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={Calendar}
                      title="No appointments found"
                      description="No records match your criteria."
                      actionText={searchQuery || statusFilter !== 'All' ? 'Clear Filters' : 'Book Appointment'}
                      onAction={() => {
                        if (searchQuery || statusFilter !== 'All') {
                          setSearchQuery('');
                          setStatusFilter('All');
                        } else {
                          setIsBookOpen(true);
                        }
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr key={app.appointment_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      #{app.appointment_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {app.patients?.first_name} {app.patients?.last_name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Dr. {app.doctors?.first_name} {app.doctors?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {app.appt_date}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono text-xs">
                      <div className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.time_slot}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(app.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        title="Book Appointment"
        maxWidth="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Patient"
              required
              value={newAppt.patient_id}
              onChange={(e) => setNewAppt({ ...newAppt, patient_id: e.target.value })}
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
              value={newAppt.doctor_id}
              onChange={(e) => setNewAppt({ ...newAppt, doctor_id: e.target.value })}
            >
              <option value="">Select doctor...</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  Dr. {d.first_name} {d.last_name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              value={newAppt.appt_date}
              onChange={(e) => setNewAppt({ ...newAppt, appt_date: e.target.value })}
            />

            <Select
              label="Time Slot"
              required
              value={newAppt.time_slot}
              onChange={(e) => setNewAppt({ ...newAppt, time_slot: e.target.value })}
            >
              <option value="">Select slot...</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="03:00 PM">03:00 PM</option>
              <option value="04:00 PM">04:00 PM</option>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBookOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
