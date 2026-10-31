import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';
import {
  Users,
  UserPlus,
  Phone,
  Droplet,
  Calendar,
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

type Patient = Database['public']['Tables']['patients']['Row'];

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    gender: '',
    blood_group: '',
    contact: '',
  });

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('patient_id', { ascending: false });

    if (error) {
      toast.error('Failed to load patients');
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.first_name || !newPatient.last_name) {
      toast.error('First and last name are required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('patients').insert([
      {
        first_name: newPatient.first_name.trim(),
        last_name: newPatient.last_name.trim(),
        dob: newPatient.dob || null,
        gender: newPatient.gender || null,
        blood_group: newPatient.blood_group ? newPatient.blood_group.trim().toUpperCase() : null,
        contact: newPatient.contact ? newPatient.contact.trim() : null,
      },
    ]);

    if (error) {
      toast.error('Error registering patient: ' + error.message);
    } else {
      toast.success('Patient registered');
      setNewPatient({
        first_name: '',
        last_name: '',
        dob: '',
        gender: '',
        blood_group: '',
        contact: '',
      });
      setIsRegisterOpen(false);
      fetchPatients();
    }
    setIsSubmitting(false);
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const contact = (p.contact || '').toLowerCase();
      const blood = (p.blood_group || '').toLowerCase();
      const id = String(p.patient_id);
      return fullName.includes(q) || contact.includes(q) || blood.includes(q) || id.includes(q);
    });
  }, [patients, searchQuery]);

  return (
    <PageContainer>
      <PageHeader
        title="Patients"
        badge={
          <Badge variant="neutral" size="sm">
            {patients.length} Total
          </Badge>
        }
      >
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsRegisterOpen(true)}
        >
          Register Patient
        </Button>
      </PageHeader>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, ID, or phone..."
          className="max-w-xs"
        />

        <div className="text-xs text-slate-500">
          {filteredPatients.length} of {patients.length} records
        </div>
      </div>

      {/* Patient Table Container */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">DOB</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <LoadingState message="Loading..." />
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={Users}
                      title="No patients found"
                      description="No records match your criteria."
                      actionText={searchQuery ? 'Clear Search' : 'Register Patient'}
                      onAction={() => {
                        if (searchQuery) setSearchQuery('');
                        else setIsRegisterOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">
                      #{p.patient_id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.dob ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.dob}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.gender || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {p.blood_group ? (
                        <Badge variant="neutral" size="sm" className="font-mono">
                          <Droplet className="w-3 h-3 text-rose-500" />
                          {p.blood_group}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {p.contact ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.contact}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Patient"
        maxWidth="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              required
              placeholder="First name"
              value={newPatient.first_name}
              onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              type="text"
              required
              placeholder="Last name"
              value={newPatient.last_name}
              onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={newPatient.dob}
              onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
            />
            <Select
              label="Gender"
              value={newPatient.gender}
              onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Blood Group"
              type="text"
              placeholder="e.g. O+, A+, B-"
              value={newPatient.blood_group}
              onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="Contact number"
              value={newPatient.contact}
              onChange={(e) => setNewPatient({ ...newPatient, contact: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRegisterOpen(false)}
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
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
