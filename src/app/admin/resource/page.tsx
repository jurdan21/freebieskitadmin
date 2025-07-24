"use client";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import { useSearch } from '@/context/SearchContext';
import Image from 'next/image';

interface Resource {
  id: number;
  title: string;
  author: string;
  platform: string;
  image: string;
  overview: string;
  category_id: number;
  compatibility: string;
  description: string;
  is_active: boolean;
  created_at: string;
  download_link?: string; // Tambah field ini
}
interface Category {
  id: number;
  name: string;
}

export default function ResourcePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    platform: "",
    image: "",
    overview: "",
    category_id: "",
    compatibility: "",
    description: "",
    is_active: true,
    download_link: "", // Tambah field ini
  });
  const [editId, setEditId] = useState<number | null>(null);
  const { keyword } = useSearch();
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const { data: resourcesData, error: resError } = await supabase
      .from("resources")
      .select("id, title, author, platform, image, overview, category_id, compatibility, description, is_active, created_at, download_link"); // Tambah download_link
    const { data: categoriesData, error: catError } = await supabase
      .from("categories")
      .select("id, name");
    if (resError || catError) setError(resError?.message || catError?.message || "Error fetching data");
    setResources(resourcesData || []);
    setCategories(categoriesData || []);
    setLoading(false);
  };

  const getCategoryName = (id: number) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name : "-";
  };

  // Perbaiki handleChange agar bebas error
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAdd = () => {
    setForm({
      title: "",
      author: "",
      platform: "",
      image: "",
      overview: "",
      category_id: categories[0]?.id ? String(categories[0].id) : "",
      compatibility: "",
      description: "",
      is_active: true,
      download_link: "", // Tambah field ini
    });
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (res: Resource) => {
    setForm({
      title: res.title || "",
      author: res.author || "",
      platform: res.platform || "",
      image: res.image || "",
      overview: res.overview || "",
      category_id: String(res.category_id) || "",
      compatibility: res.compatibility || "",
      description: res.description || "",
      is_active: res.is_active,
      download_link: res.download_link || "", // Tambah field ini
    });
    setEditId(res.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) setError(error.message);
    await fetchData();
    setLoading(false);
  };

  const handleCancel = () => {
    setForm({
      title: "",
      author: "",
      platform: "",
      image: "",
      overview: "",
      category_id: categories[0]?.id ? String(categories[0].id) : "",
      compatibility: "",
      description: "",
      is_active: true,
      download_link: "", // Tambah field ini
    });
    setEditId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (editId) {
      // Edit
      const { error } = await supabase
        .from("resources")
        .update({ ...form, category_id: Number(form.category_id) })
        .eq("id", editId);
      if (error) setError(error.message);
    } else {
      // Add
      const { error } = await supabase
        .from("resources")
        .insert([{ ...form, category_id: Number(form.category_id) }]);
      if (error) setError(error.message);
    }
    setIsModalOpen(false);
    setForm({
      title: "",
      author: "",
      platform: "",
      image: "",
      overview: "",
      category_id: categories[0]?.id ? String(categories[0].id) : "",
      compatibility: "",
      description: "",
      is_active: true,
      download_link: "", // Tambah field ini
    });
    setEditId(null);
    await fetchData();
    setLoading(false);
  };

  // Filter resources berdasarkan keyword dan kategori
  const filteredResources = resources.filter(res => {
    const matchKeyword =
      res.title.toLowerCase().includes(keyword.toLowerCase()) ||
      res.author.toLowerCase().includes(keyword.toLowerCase()) ||
      res.platform.toLowerCase().includes(keyword.toLowerCase()) ||
      res.overview.toLowerCase().includes(keyword.toLowerCase()) ||
      res.description.toLowerCase().includes(keyword.toLowerCase());
    const matchCategory = filterCategoryId === 'all' || String(res.category_id) === filterCategoryId;
    return matchKeyword && matchCategory;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6 w-full">
      <h1 className="text-xl font-bold mb-4">Resource List</h1>
      {/* Filter by Category */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <label htmlFor="filter-category" className="font-medium text-gray-700 dark:text-white/80">Filter by Category:</label>
        <select
          id="filter-category"
          className="border rounded-lg px-3 py-2 w-full sm:w-auto"
          value={filterCategoryId}
          onChange={e => setFilterCategoryId(e.target.value)}
        >
          <option value="all">All</option>
          {categories.map(cat => (
            <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
          ))}
        </select>
      </div>
      <Button size="sm" onClick={handleAdd} className="mb-4">+ Add Resource</Button>
      <Modal isOpen={isModalOpen} onClose={handleCancel} className="max-w-[700px] p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {editId ? "Edit Resource" : "Add Resource"}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <input name="title" value={String(form.title)} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <Label>Author</Label>
            <input name="author" value={String(form.author)} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <Label>Platform</Label>
            <input name="platform" value={String(form.platform)} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <Label>Image URL</Label>
            <input name="image" value={String(form.image)} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <Label>Overview</Label>
            <textarea name="overview" value={String(form.overview)} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" rows={3} />
          </div>
          <div>
            <Label>Category</Label>
            <select name="category_id" value={String(form.category_id)} onChange={handleChange} className="w-full border rounded-lg px-3 py-2">
              {categories.map((cat: Category) => (
                <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Compatibility</Label>
            <input name="compatibility" value={String(form.compatibility)} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <Label>Description</Label>
            <textarea name="description" value={String(form.description)} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" rows={3} />
          </div>
          {/* Tambahkan input download_link */}
          <div>
            <Label>Download Link</Label>
            <input name="download_link" value={String(form.download_link)} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active" />
            <Label htmlFor="is_active">Active</Label>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="btn" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>
      {/* Hanya tabel yang bisa discroll */}
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto w-full">
          <Table className="table-fixed w-full min-w-[1700px]">
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="w-32 px-8 py-4 font-medium text-gray-500 text-start">ID</TableCell>
                  <TableCell isHeader className="w-56 px-8 py-4 font-medium text-gray-500 text-start">Title</TableCell>
                  <TableCell isHeader className="w-56 px-8 py-4 font-medium text-gray-500 text-start">Author</TableCell>
                  <TableCell isHeader className="w-56 px-8 py-4 font-medium text-gray-500 text-start">Platform</TableCell>
                  <TableCell isHeader className="w-48 px-8 py-4 font-medium text-gray-500 text-start">Image</TableCell>
                  <TableCell isHeader className="w-56 px-8 py-4 font-medium text-gray-500 text-start">Overview</TableCell>
                  <TableCell isHeader className="w-56 px-8 py-4 font-medium text-gray-500 text-start">Category</TableCell>
                  <TableCell isHeader className="w-56 px-8 py-4 font-medium text-gray-500 text-start">Compatibility</TableCell>
                  <TableCell isHeader className="w-56 px-8 py-4 font-medium text-gray-500 text-start">Description</TableCell>
                  <TableCell isHeader className="w-56 px-8 py-4 font-medium text-gray-500 text-start">Download Link</TableCell>
                  <TableCell isHeader className="w-40 px-8 py-4 font-medium text-gray-500 text-start">Is Active</TableCell>
                  <TableCell isHeader className="w-64 px-8 py-4 font-medium text-gray-500 text-start">Created At</TableCell>
                  <TableCell isHeader className="w-40 px-8 py-4 font-medium text-gray-500 text-start">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredResources.map((res: Resource) => (
                  <TableRow key={res.id}>
                    <TableCell className="w-32 px-8 py-4">{res.id}</TableCell>
                    <TableCell className="w-56 px-8 py-4 truncate overflow-hidden whitespace-nowrap">{res.title}</TableCell>
                    <TableCell className="w-56 px-8 py-4 truncate overflow-hidden whitespace-nowrap">{res.author}</TableCell>
                    <TableCell className="w-56 px-8 py-4 truncate overflow-hidden whitespace-nowrap">{res.platform}</TableCell>
                    <TableCell className="w-48 px-8 py-4">
                      {res.image && res.image.startsWith("http") ? (
                        <Image src={res.image} alt={res.title} width={48} height={48} className="w-12 h-12 object-contain" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="w-56 px-8 py-4 truncate overflow-hidden whitespace-nowrap">{res.overview}</TableCell>
                    <TableCell className="w-56 px-8 py-4 truncate overflow-hidden whitespace-nowrap">{getCategoryName(res.category_id)}</TableCell>
                    <TableCell className="w-56 px-8 py-4 truncate overflow-hidden whitespace-nowrap">{res.compatibility}</TableCell>
                    <TableCell className="w-56 px-8 py-4 truncate overflow-hidden whitespace-nowrap">{res.description}</TableCell>
                    {/* Kolom Download Link */}
                    <TableCell className="w-56 px-8 py-4 truncate overflow-hidden whitespace-nowrap">
                      {res.download_link ? (
                        <a href={res.download_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Download</a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="w-40 px-8 py-4 truncate overflow-hidden whitespace-nowrap">
                      {res.is_active ? (
                        <span className="text-green-600 font-semibold">Active</span>
                      ) : (
                        <span className="text-red-500 font-semibold">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="w-64 px-8 py-4 truncate overflow-hidden whitespace-nowrap">{res.created_at}</TableCell>
                    <TableCell className="w-40 px-8 py-4">
                      <button type="button" className="text-blue-500 hover:underline mr-2" onClick={() => handleEdit(res)}>Edit</button>
                      <button type="button" className="text-red-500 hover:underline" onClick={() => handleDelete(res.id)}>Delete</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      )}
    </div>
  );
} 