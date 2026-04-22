"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Field, Input } from "@/components/FormFields";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Eye, Car, Search, Loader2, Calendar, X } from "lucide-react";
import { format } from "date-fns";

interface CarEntry {
  _id: string;
  carName: string;
  carNumber: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

const EMPTY_FORM = {
  carName: "",
  carNumber: "",
  amount: "",
  date: format(new Date(), "yyyy-MM-dd"),
  notes: "",
};

function CarForm({
  idPrefix,
  form,
  setForm,
  saving,
  onCancel,
  onSubmit,
}: {
  idPrefix: string;
  form: typeof EMPTY_FORM;
  setForm: (next: typeof EMPTY_FORM) => void;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Car Name" required>
        <Input
          id={`${idPrefix}-car-name`}
          placeholder="e.g. Toyota Fortuner"
          value={form.carName}
          onChange={(e) => setForm({ ...form, carName: e.target.value })}
          required
        />
      </Field>
      <Field label="Number Plate" required>
        <Input
          id={`${idPrefix}-car-number`}
          placeholder="e.g. GJ01AB1234"
          value={form.carNumber}
          onChange={(e) => setForm({ ...form, carNumber: e.target.value.toUpperCase() })}
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)" required>
          <Input
            id={`${idPrefix}-car-amount`}
            type="number"
            min="0"
            step="1"
            placeholder="500"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
        </Field>
        <Field label="Date">
          <Input
            id={`${idPrefix}-car-date`}
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          id={`${idPrefix}-car-notes`}
          placeholder="Optional notes…"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none"
        />
      </Field>
      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          id={`${idPrefix}-save-car-btn`}
          className="flex-1 py-2.5 rounded-xl bg-[#1e2235] hover:bg-[#2c3150] text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : idPrefix === "add" ? "Add Entry" : "Update Entry"}
        </button>
      </div>
    </form>
  );
}

export default function CarsPage() {
  const [entries, setEntries] = useState<CarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selected, setSelected] = useState<CarEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterDate ? `?date=${filterDate}` : "";
      const res = await fetch(`/api/cars${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.message || "Failed to load entries"); setEntries([]); return; }
      setEntries(data.entries || []);
    } catch { toast.error("Failed to load entries"); } finally { setLoading(false); }
  }, [filterDate]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { setPage(1); }, [search, filterDate]);

  function openAdd() { setForm(EMPTY_FORM); setAddOpen(true); }
  function openEdit(e: CarEntry) {
    setSelected(e);
    setForm({ carName: e.carName, carNumber: e.carNumber, amount: String(e.amount), date: format(new Date(e.date), "yyyy-MM-dd"), notes: e.notes || "" });
    setEditOpen(true);
  }
  function openView(e: CarEntry) { setSelected(e); setViewOpen(true); }
  function openDelete(e: CarEntry) { setSelected(e); setDeleteOpen(true); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const submittedDate = form.date;
    try {
      const res = await fetch("/api/cars", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.message || "Error"); return; }
      toast.success("Car entry added!"); setAddOpen(false);
      if (submittedDate && submittedDate !== filterDate) { setFilterDate(submittedDate); } else { fetchEntries(); }
    } catch { toast.error("Something went wrong"); } finally { setSaving(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault(); if (!selected) return; setSaving(true);
    try {
      const res = await fetch(`/api/cars/${selected._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.message || "Error"); return; }
      toast.success("Entry updated!"); setEditOpen(false); fetchEntries();
    } catch { toast.error("Something went wrong"); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selected) return; setDeleting(true);
    try {
      const res = await fetch(`/api/cars/${selected._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.message || "Error"); return; }
      toast.success("Entry deleted"); setDeleteOpen(false); fetchEntries();
    } catch { toast.error("Something went wrong"); } finally { setDeleting(false); }
  }

  const filtered = entries.filter(
    (e) => e.carName.toLowerCase().includes(search.toLowerCase()) || e.carNumber.toLowerCase().includes(search.toLowerCase())
  );
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <AppShell title="Car Entries" subtitle="Track every car wash">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="car-search"
            placeholder="Search car name or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all"
          />
        </div>
        <div className="relative">
          <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            id="car-date-filter"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-400 transition-all"
          />
          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title="Clear date filter"
              aria-label="Clear date filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          id="add-car-btn"
          onClick={openAdd}
          className="flex items-center justify-center gap-2 bg-[#1e2235] hover:bg-[#2c3150] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
        >
          <Plus size={15} />
          Add Entry
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex gap-2.5 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
          <Car size={13} className="text-slate-400" />
          <span className="text-slate-600 text-sm font-medium">{filtered.length} entries</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-slate-500 text-sm">Total:</span>
          <span className="text-slate-800 text-sm font-bold">₹{totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Car Name", "Number Plate", "Amount", "Date", "Actions"].map((h, i) => (
                  <th key={h} className={`text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5 ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <Car size={30} className="text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-slate-400 text-sm">No car entries found</p>
                    <button onClick={openAdd} className="mt-2 text-slate-500 hover:text-slate-800 text-sm underline underline-offset-2 transition-colors">Add your first entry</button>
                  </td>
                </tr>
              ) : (
                paged.map((entry) => (
                  <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Car size={14} className="text-blue-500" strokeWidth={1.5} />
                        </div>
                        <span className="text-slate-800 text-sm font-medium">{entry.carName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{entry.carNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-800 text-sm font-semibold">₹{entry.amount.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-500 text-sm">{format(new Date(entry.date), "dd MMM yyyy")}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openView(entry)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="View"><Eye size={14} /></button>
                        <button onClick={() => openEdit(entry)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => openDelete(entry)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Car size={30} className="text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-slate-400 text-sm">No car entries found</p>
            </div>
          ) : (
            paged.map((entry) => (
              <div key={entry._id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Car size={15} className="text-blue-500" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-800 text-sm font-semibold truncate">{entry.carName}</p>
                      <p className="text-slate-400 text-xs font-mono mt-0.5">{entry.carNumber}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-slate-800 text-base font-bold">₹{entry.amount.toLocaleString("en-IN")}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{format(new Date(entry.date), "dd MMM yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => openView(entry)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium transition-all"><Eye size={12} />View</button>
                  <button onClick={() => openEdit(entry)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 text-xs font-medium transition-all"><Pencil size={12} />Edit</button>
                  <button onClick={() => openDelete(entry)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 text-xs font-medium transition-all"><Trash2 size={12} />Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Pagination page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

      {/* Modals */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Car Entry">
        <CarForm
          idPrefix="add"
          form={form}
          setForm={setForm}
          saving={saving}
          onCancel={() => setAddOpen(false)}
          onSubmit={handleAdd}
        />
      </Modal>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Car Entry">
        <CarForm
          idPrefix="edit"
          form={form}
          setForm={setForm}
          saving={saving}
          onCancel={() => setEditOpen(false)}
          onSubmit={handleEdit}
        />
      </Modal>
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Car Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <Car size={20} className="text-blue-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-slate-800 font-bold text-base">{selected.carName}</p>
                <p className="text-slate-500 font-mono text-sm mt-0.5">{selected.carNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Amount</p>
                <p className="text-slate-800 font-bold text-lg">₹{selected.amount.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Date</p>
                <p className="text-slate-800 font-semibold text-sm">{format(new Date(selected.date), "dd MMM yyyy")}</p>
              </div>
            </div>
            {selected.notes && (
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Notes</p>
                <p className="text-slate-600 text-sm leading-relaxed">{selected.notes}</p>
              </div>
            )}
            <p className="text-slate-400 text-xs">Added on {format(new Date(selected.createdAt), "dd MMM yyyy, hh:mm a")}</p>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete entry for "${selected?.carName} (${selected?.carNumber})"? This cannot be undone.`}
      />
    </AppShell>
  );
}