"use client";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import { useModal } from "@/hooks/useModal";
import { supabase } from "@/lib/supabaseClient";
import { useSearch } from '@/context/SearchContext';

interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export default function MasterCategoriesPage() {
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState({ name: "", slug: "", is_active: true });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const { keyword } = useSearch();

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, is_active, created_at")
      .order("id", { ascending: true });
    if (error) setError(error.message);
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Open modal for edit
  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, slug: cat.slug, is_active: cat.is_active });
    setEditId(cat.id);
    openModal();
  };

  // Delete category
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) setError(error.message);
    fetchCategories();
    setLoading(false);
  };

  // Cancel handler
  const handleCancel = () => {
    setForm({ name: "", slug: "", is_active: true });
    setEditId(null);
    closeModal();
  };

  // Submit for add/edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (editId) {
      // Edit mode
      const { error } = await supabase
        .from("categories")
        .update({ name: form.name, slug: form.slug, is_active: form.is_active })
        .eq("id", editId);
      if (error) setError(error.message);
    } else {
      // Add mode
      const { error } = await supabase.from("categories").insert([
        { name: form.name, slug: form.slug, is_active: form.is_active },
      ]);
      if (error) setError(error.message);
    }
    setForm({ name: "", slug: "", is_active: true });
    setEditId(null);
    closeModal();
    fetchCategories();
    setLoading(false);
  };

  // Filter categories berdasarkan keyword
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(keyword.toLowerCase()) ||
    cat.slug.toLowerCase().includes(keyword.toLowerCase())
  );

  const defaultCategories = [
    { name: 'Website UI Kit', slug: 'website-ui-kit' },
    { name: 'Mobile UI Kit', slug: 'mobile-ui-kit' },
    { name: 'Dashboard UI Kit', slug: 'dashboard-ui-kit' },
    { name: 'Device Mockup', slug: 'device-mockup' },
    { name: 'Icons', slug: 'icons' },
    { name: 'Templates', slug: 'templates' },
    { name: 'Presentations', slug: 'presentations' },
    { name: 'Fonts', slug: 'fonts' },
    { name: 'Illustrations', slug: 'illustrations' },
    { name: '3D Assets', slug: '3d-assets' },
    { name: 'Branding Mockup', slug: 'branding-mockup' },
    { name: 'Social Media', slug: 'social-media' },
    { name: 'Motions', slug: 'motions' },
    { name: 'Web Design Inspiration', slug: 'web-design-inspiration' },
  ];

  const handleImportDefault = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('categories').insert(defaultCategories);
    if (error) setError(error.message);
    await fetchCategories();
    setLoading(false);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <h1 className="text-xl font-bold mb-4">Master Categories</h1>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <Button size="sm" onClick={openModal}>+ Add Category</Button>
        <Button size="sm" variant="outline" onClick={handleImportDefault}>Import Default Categories</Button>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {editId ? "Edit Category" : "Add Category"}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <Label>Slug</Label>
            <input name="slug" value={form.slug} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active" />
            <Label htmlFor="is_active">Active</Label>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>
      <div className="max-w-full overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : (
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">ID</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Name</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Slug</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Is Active</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Created At</TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredCategories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="px-5 py-4">{cat.id}</TableCell>
                  <TableCell className="px-5 py-4">{cat.name}</TableCell>
                  <TableCell className="px-5 py-4">{cat.slug}</TableCell>
                  <TableCell className="px-5 py-4">
                    {cat.is_active ? (
                      <span className="text-green-600 font-semibold">Active</span>
                    ) : (
                      <span className="text-red-500 font-semibold">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4">{cat.created_at}</TableCell>
                  <TableCell className="px-5 py-4">
                    <button type="button" className="text-blue-500 hover:underline mr-2" onClick={() => handleEdit(cat)}>Edit</button>
                    <button type="button" className="text-red-500 hover:underline" onClick={() => handleDelete(cat.id)}>Delete</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
} 