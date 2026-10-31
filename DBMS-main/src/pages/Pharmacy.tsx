import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';
import {
  Pill,
  Plus,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SearchInput } from '../components/ui/SearchInput';
import { Modal } from '../components/ui/Modal';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';

type Medication = Database['public']['Tables']['medications']['Row'];
type Admission = Database['public']['Tables']['admissions']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

export default function Pharmacy() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [admissions, setAdmissions] = useState<(Admission & { patients: Patient })[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);
  const [isPrescribing, setIsPrescribing] = useState(false);

  const [newMed, setNewMed] = useState({ med_name: '', unit_price: '', stock_qty: '' });
  const [prescription, setPrescription] = useState({
    admission_id: '',
    med_id: '',
    quantity: '',
    dosage_instructions: '',
  });

  const fetchData = async () => {
    const [medRes, admRes] = await Promise.all([
      supabase.from('medications').select('*').order('med_name'),
      supabase.from('admissions').select('*, patients(*)').is('discharge_date', null),
    ]);

    if (medRes.error) toast.error('Failed to load medications');
    else setMedications(medRes.data || []);

    if (admRes.error) toast.error('Failed to load active admissions');
    else setAdmissions((admRes.data as any) || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.med_name.trim() || !newMed.unit_price || !newMed.stock_qty) {
      toast.error('All fields are required');
      return;
    }

    setIsSubmittingMed(true);
    const { error } = await supabase.from('medications').insert([
      {
        med_name: newMed.med_name.trim(),
        unit_price: parseFloat(newMed.unit_price),
        stock_qty: parseInt(newMed.stock_qty, 10),
      },
    ]);

    if (error) {
      toast.error('Error adding medication: ' + error.message);
    } else {
      toast.success('Medication added');
      setNewMed({ med_name: '', unit_price: '', stock_qty: '' });
      setIsAddMedOpen(false);
      fetchData();
    }
    setIsSubmittingMed(false);
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription.admission_id || !prescription.med_id || !prescription.quantity) {
      toast.error('Admission, medication, and quantity are required');
      return;
    }

    setIsPrescribing(true);
    const { error } = await supabase.from('prescription_items').insert([
      {
        admission_id: parseInt(prescription.admission_id, 10),
        med_id: parseInt(prescription.med_id, 10),
        quantity: parseInt(prescription.quantity, 10),
        dosage_instructions: prescription.dosage_instructions
          ? prescription.dosage_instructions.trim()
          : null,
      },
    ]);

    if (error) {
      if (error.message.includes('stock_qty')) {
        toast.error('Insufficient stock to fulfill prescription');
      } else {
        toast.error('Error prescribing: ' + error.message);
      }
    } else {
      toast.success('Prescription issued');
      setPrescription({ admission_id: '', med_id: '', quantity: '', dosage_instructions: '' });
      fetchData();
    }
    setIsPrescribing(false);
  };

  const filteredMeds = useMemo(() => {
    if (!searchQuery.trim()) return medications;
    const q = searchQuery.toLowerCase();
    return medications.filter((m) => m.med_name.toLowerCase().includes(q));
  }, [medications, searchQuery]);

  const selectedMed = useMemo(() => {
    if (!prescription.med_id) return null;
    return medications.find((m) => m.med_id === parseInt(prescription.med_id, 10));
  }, [medications, prescription.med_id]);

  return (
    <PageContainer>
      <PageHeader
        title="Pharmacy"
        badge={
          <Badge variant="neutral" size="sm">
            {medications.length} Drugs
          </Badge>
        }
      >
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddMedOpen(true)}
        >
          Add Medication
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Medication Inventory (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search medications..."
              className="w-full sm:max-w-xs"
            />
            <div className="text-xs text-slate-500">
              {filteredMeds.length} of {medications.length} records
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
                    <th className="py-3 px-4">Medication</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-0">
                        <LoadingState message="Loading..." />
                      </td>
                    </tr>
                  ) : filteredMeds.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8">
                        <EmptyState
                          icon={Pill}
                          title="No medications found"
                          description="No records match your search."
                          actionText={searchQuery ? 'Clear Filter' : 'Add Medication'}
                          onAction={() => {
                            if (searchQuery) setSearchQuery('');
                            else setIsAddMedOpen(true);
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredMeds.map((m) => {
                      const isLowStock = m.stock_qty < m.min_threshold;
                      return (
                        <tr key={m.med_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {m.med_name}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            ${Number(m.unit_price).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-900">
                            {m.stock_qty}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isLowStock ? (
                              <Badge variant="danger" size="sm" dot>
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm" dot>
                                In Stock
                              </Badge>
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
        </div>

        {/* Right: Issue Prescription Form (5 Cols) */}
        <div className="lg:col-span-5">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="py-4">
              <CardTitle>Issue Prescription</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handlePrescribe} className="space-y-4">
                <div>
                  <Select
                    label="Patient Admission"
                    required
                    value={prescription.admission_id}
                    onChange={(e) => setPrescription({ ...prescription, admission_id: e.target.value })}
                  >
                    <option value="">Select admitted patient...</option>
                    {admissions.map((a) => (
                      <option key={a.admission_id} value={a.admission_id}>
                        {a.patients?.first_name} {a.patients?.last_name} (Room {a.admission_id})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Select
                    label="Medication"
                    required
                    value={prescription.med_id}
                    onChange={(e) => setPrescription({ ...prescription, med_id: e.target.value })}
                  >
                    <option value="">Select medication...</option>
                    {medications.map((m) => (
                      <option key={m.med_id} value={m.med_id}>
                        {m.med_name} (${m.unit_price})
                      </option>
                    ))}
                  </Select>
                </div>

                {selectedMed && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-700">
                    <span>Available Stock:</span>
                    <span className="font-bold font-mono">{selectedMed.stock_qty} units</span>
                  </div>
                )}

                <div>
                  <Input
                    label="Quantity"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 10"
                    value={prescription.quantity}
                    onChange={(e) => setPrescription({ ...prescription, quantity: e.target.value })}
                  />
                </div>

                <div>
                  <Input
                    label="Dosage Instructions"
                    type="text"
                    placeholder="e.g. 1 tablet twice daily"
                    value={prescription.dosage_instructions}
                    onChange={(e) => setPrescription({ ...prescription, dosage_instructions: e.target.value })}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    isLoading={isPrescribing}
                    disabled={admissions.length === 0 || medications.length === 0}
                  >
                    Prescribe Medication
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Medication Modal */}
      <Modal
        isOpen={isAddMedOpen}
        onClose={() => setIsAddMedOpen(false)}
        title="Add Medication"
        maxWidth="sm"
      >
        <form onSubmit={handleAddMed} className="space-y-4">
          <Input
            label="Medication Name"
            type="text"
            required
            placeholder="e.g. Amoxicillin 500mg"
            value={newMed.med_name}
            onChange={(e) => setNewMed({ ...newMed, med_name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Unit Price"
              type="number"
              step="0.01"
              required
              placeholder="e.g. 12.50"
              value={newMed.unit_price}
              onChange={(e) => setNewMed({ ...newMed, unit_price: e.target.value })}
            />

            <Input
              label="Initial Stock"
              type="number"
              required
              placeholder="e.g. 100"
              value={newMed.stock_qty}
              onChange={(e) => setNewMed({ ...newMed, stock_qty: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddMedOpen(false)}
              disabled={isSubmittingMed}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingMed}
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
