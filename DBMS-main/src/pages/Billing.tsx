import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';
import {
  ReceiptText,
  CheckCircle2,
  Clock,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchInput } from '../components/ui/SearchInput';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type Admission = Database['public']['Tables']['admissions']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

export default function Billing() {
  const [invoices, setInvoices] = useState<(Invoice & { admissions: Admission & { patients: Patient } })[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Paid'>('All');

  const [payTargetInvoice, setPayTargetInvoice] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        admissions (
          *,
          patients (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load invoices');
    } else {
      setInvoices((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleMarkPaidConfirm = async () => {
    if (!payTargetInvoice) return;

    setIsUpdating(true);
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'Paid' })
      .eq('invoice_id', payTargetInvoice);

    if (error) {
      toast.error('Failed to update invoice: ' + error.message);
    } else {
      toast.success(`Invoice #${payTargetInvoice} marked as Paid`);
      setPayTargetInvoice(null);
      fetchInvoices();
    }
    setIsUpdating(false);
  };

  const financialMetrics = useMemo(() => {
    const totalBilled = invoices.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const totalPaid = invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const pendingTotal = invoices
      .filter((inv) => inv.status === 'Pending')
      .reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);

    return { totalBilled, totalPaid, pendingTotal, count: invoices.length };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const pName = `${inv.admissions?.patients?.first_name || ''} ${inv.admissions?.patients?.last_name || ''}`.toLowerCase();
      const id = String(inv.invoice_id);
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || pName.includes(q) || id.includes(q);
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  return (
    <PageContainer>
      <PageHeader
        title="Billing"
        badge={
          <Badge variant="neutral" size="sm">
            {invoices.length} Invoices
          </Badge>
        }
      />

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Total Invoiced</span>
            <ReceiptText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            ${financialMetrics.totalBilled.toFixed(2)}
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1">
            ${financialMetrics.totalPaid.toFixed(2)}
          </div>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-800 mt-1">
            ${financialMetrics.pendingTotal.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by invoice ID or patient..."
            className="w-full sm:max-w-xs"
          />

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            {(['All', 'Pending', 'Paid'] as const).map((tab) => (
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
          {filteredInvoices.length} of {invoices.length} records
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Breakdown</th>
                <th className="py-3 px-4">Total</th>
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
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={ReceiptText}
                      title="No invoices found"
                      description="No records match your criteria."
                      actionText={searchQuery || statusFilter !== 'All' ? 'Clear Filters' : undefined}
                      onAction={() => {
                        setSearchQuery('');
                        setStatusFilter('All');
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'Paid';
                  return (
                    <tr key={inv.invoice_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        #{inv.invoice_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {inv.admissions?.patients?.first_name} {inv.admissions?.patients?.last_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(inv.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        <span className="font-mono text-slate-500">
                          R: ${Number(inv.room_charge).toFixed(0)} • D: ${Number(inv.doctor_charge).toFixed(0)} • P: ${Number(inv.pharmacy_charge).toFixed(0)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        ${Number(inv.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {isPaid ? (
                          <Badge variant="success" size="sm" dot>
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm" dot>
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isPaid ? (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                            onClick={() => setPayTargetInvoice(inv.invoice_id)}
                          >
                            Mark Paid
                          </Button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-medium">Settled</span>
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

      {/* Mark Paid Confirmation Dialog */}
      <ConfirmDialog
        isOpen={payTargetInvoice !== null}
        onClose={() => setPayTargetInvoice(null)}
        onConfirm={handleMarkPaidConfirm}
        title="Confirm Payment"
        description={`Mark Invoice #${payTargetInvoice} as Paid?`}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="primary"
        isLoading={isUpdating}
      />
    </PageContainer>
  );
}
