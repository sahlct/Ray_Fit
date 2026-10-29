"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Upload,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Check,
  Move,
  Loader2,
} from "lucide-react";
import { TenantHeader } from "@/components/navigation/tenant-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";

interface Banner {
  id: string;
  tenantId: string;
  title: string;
  imageUrl: string;
  targetUrl: string | null;
  placement: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function BannersPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [modalError, setModalError] = useState("");

  // Preview Carousel State
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    targetUrl: "",
    placement: "APP_DASHBOARD_CAROUSEL",
    sortOrder: 1,
    isActive: true,
  });

  // Image Cropper & Editor State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>("");
  const [cropAspectRatio, setCropAspectRatio] = useState<number>(2.4); // Default 2.4:1 landscape
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropRotation, setCropRotation] = useState<number>(0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isUploadingCrop, setIsUploadingCrop] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewBoxRef = useRef<HTMLDivElement | null>(null);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/${slug}/banners`);
      const data = await res.json();
      if (data.banners) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.error("Failed to load banners:", err);
      toast.error("Failed to load ad banners.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) loadBanners();
  }, [slug]);

  // Auto slide simulator for active banners
  const activeBanners = banners.filter((b) => b.isActive);
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActivePreviewIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setForm({
      title: "",
      imageUrl: "",
      targetUrl: "",
      placement: "APP_DASHBOARD_CAROUSEL",
      sortOrder: banners.length + 1,
      isActive: true,
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      targetUrl: banner.targetUrl || "",
      placement: banner.placement,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    setModalError("");
    setIsModalOpen(true);
  };

  // Image Selection & Auto-Launch Cropper Modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setRawImageSrc(result);
      setCropZoom(1);
      setCropRotation(0);
      setPanOffset({ x: 0, y: 0 });
      setCropAspectRatio(2.4); // Optimal mobile slider landscape ratio
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Drag / Pan Handlers for Crop Canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  // High-Resolution Canvas Crop & Server Storage
  const handleSaveCroppedImage = async () => {
    if (!rawImageSrc || !imgRef.current) return;
    setIsUploadingCrop(true);

    try {
      const img = imgRef.current;
      const targetW = 1200;
      const targetH = Math.round(targetW / cropAspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D canvas context.");

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, targetW, targetH);

      ctx.save();
      ctx.translate(targetW / 2, targetH / 2);
      ctx.rotate((cropRotation * Math.PI) / 180);
      ctx.scale(cropZoom, cropZoom);

      const boxW = previewBoxRef.current?.clientWidth || 460;
      const scaleFactor = targetW / boxW;
      ctx.translate((panOffset.x * scaleFactor) / cropZoom, (panOffset.y * scaleFactor) / cropZoom);

      const natW = img.naturalWidth || 800;
      const natH = img.naturalHeight || 600;
      const coverScale = Math.max(targetW / natW, targetH / natH);
      const drawW = natW * coverScale;
      const drawH = natH * coverScale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

      // Upload to server
      const res = await fetch(`/api/${slug}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to upload cropped image");

      setForm((prev) => ({
        ...prev,
        imageUrl: resData.url,
      }));

      toast.success("Image cropped & stored successfully!");
      setIsCropperOpen(false);
    } catch (err: any) {
      console.error("Cropper error:", err);
      toast.error(err.message || "Failed to process image crop.");
    } finally {
      setIsUploadingCrop(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!form.imageUrl) {
      setModalError("Please select and crop a banner image file.");
      return;
    }

    try {
      if (editingBanner) {
        // Update
        const res = await fetch(`/api/${slug}/banners/${editingBanner.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update banner");
        toast.success("Ad banner updated successfully!");
      } else {
        // Create
        const res = await fetch(`/api/${slug}/banners`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create banner");
        toast.success("Ad banner created successfully!");
      }

      setIsModalOpen(false);
      loadBanners();
    } catch (err: any) {
      setModalError(err.message);
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/${slug}/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(
        `Banner "${banner.title}" ${!banner.isActive ? "activated" : "deactivated"}`
      );
      loadBanners();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`Are you sure you want to delete "${banner.title}"?`)) return;

    try {
      const res = await fetch(`/api/${slug}/banners/${banner.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete banner");
      toast.success("Ad banner deleted successfully.");
      loadBanners();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <TenantHeader
        title="Ad Tiles & Mobile Carousel Slider"
        subtitle="Manage promotional carousel slides and partner sponsor tiles displayed at the top of the Ray Fit mobile app"
        tenantSlug={slug}
      />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Mobile Carousel Ad Management</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active slides rotate automatically in a carousel tile at the top of the student mobile app
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="text-xs font-semibold py-1 px-3">
              {activeBanners.length} Active / {banners.length} Total Slides
            </Badge>
            <Button
              onClick={handleOpenCreateModal}
              className="gap-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-md shadow-teal-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ad Slide</span>
            </Button>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Column 1 & 2: Banners List / Grid */}
          <div className="xl:col-span-2 space-y-4">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                Loading ad banners...
              </div>
            ) : banners.length === 0 ? (
              <div className="p-12 glass-card rounded-2xl border-dashed border-2 border-slate-300 dark:border-slate-800 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No Ad Slides Configured Yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Create ad banners for company sponsors, athletic events, or wellness reminders to display them at the top of the mobile app.
                  </p>
                </div>
                <Button
                  onClick={handleOpenCreateModal}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                >
                  Create First Ad Slide
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {banners.map((b) => (
                  <div
                    key={b.id}
                    className={`glass-card p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      b.isActive
                        ? "border-slate-200 dark:border-slate-800 hover:border-teal-500/50"
                        : "opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Image Thumbnail */}
                      <div className="w-28 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 relative">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src =
                              "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono">
                          #{b.sortOrder}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {b.title}
                          </h4>
                          {b.isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shrink-0">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>

                        {b.targetUrl && (
                          <a
                            href={b.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 truncate max-w-sm"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{b.targetUrl}</span>
                          </a>
                        )}

                        <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                          Placement: {b.placement}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(b)}
                        className="text-xs h-8"
                      >
                        {b.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEditModal(b)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(b)}
                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Live Mobile App Carousel Preview */}
          <div className="glass-card rounded-2xl p-6 border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-teal-800 dark:text-teal-400">
                <Smartphone className="w-4 h-4" />
                <span>Mobile App Live Preview</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Student View
              </Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              This preview reflects how active carousel banners display on the mobile app dashboard.
            </p>

            {/* Phone Screen Mockup Frame */}
            <div className="mx-auto w-[280px] bg-slate-900 rounded-[28px] p-3 shadow-2xl border-4 border-slate-800 relative">
              {/* Phone Notch/Speaker */}
              <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-2.5 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-950 mr-2" />
                <div className="w-6 h-1 rounded-full bg-slate-900" />
              </div>

              {/* Mock App Screen Header */}
              <div className="px-2 py-1 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-teal-500 flex items-center justify-center text-[10px] text-white">
                    ⌚
                  </div>
                  <span className="text-xs font-black text-white">Ray Fit</span>
                </div>
                <div className="text-[11px] font-bold text-slate-200">sahal</div>
              </div>

              {/* The Carousel Banner in App */}
              <div className="relative rounded-xl overflow-hidden aspect-[2.4/1] bg-slate-800 shadow-md group">
                {activeBanners.length > 0 ? (
                  <>
                    <img
                      src={activeBanners[activePreviewIndex]?.imageUrl}
                      alt={activeBanners[activePreviewIndex]?.title}
                      className="w-full h-full object-cover transition-all duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-2.5">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-teal-300">
                        Featured Announcement
                      </span>
                      <h5 className="text-[10px] font-bold text-white leading-tight line-clamp-2 mt-0.5">
                        {activeBanners[activePreviewIndex]?.title}
                      </h5>
                    </div>

                    {/* Navigation Arrows on Hover */}
                    {activeBanners.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setActivePreviewIndex(
                              (prev) => (prev - 1 + activeBanners.length) % activeBanners.length
                            )
                          }
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            setActivePreviewIndex((prev) => (prev + 1) % activeBanners.length)
                          }
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {/* Dot Indicators */}
                    <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
                      {activeBanners.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full transition-all ${
                            i === activePreviewIndex
                              ? "w-3 bg-teal-400"
                              : "w-1 bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                    <span className="text-[10px]">No active ad slides</span>
                  </div>
                )}
              </div>

              {/* Mock App Body (Step Ring) */}
              <div className="mt-3 p-3 bg-slate-800/80 rounded-xl flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-teal-500 flex items-center justify-center text-[10px] text-white font-bold">
                  8.4k
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">Daily Steps Goal</div>
                  <div className="text-[9px] text-teal-400">100% completed today</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal 1: Add / Edit Ad Banner */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? "Edit Ad Slide" : "Add Ad Banner Slide"}
        description="Select image file, customize crop & orientation, and configure mobile carousel slide"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Hidden File Input for Native File Selection */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Banner Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ad Banner Title *
            </label>
            <Input
              required
              placeholder="e.g. Annual Sports Meet 2026, Sponsor Hydration Station"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          {/* Image File Selector & Crop Action */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Banner Image File (Landscape Mobile Carousel) *</span>
              {form.imageUrl && (
                <span className="text-[11px] font-normal text-teal-600 dark:text-teal-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stored & Ready
                </span>
              )}
            </label>

            {form.imageUrl ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-[2.4/1] bg-slate-950 group">
                  <img
                    src={form.imageUrl}
                    alt="Current Banner Crop"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" /> Replace Image
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setRawImageSrc(form.imageUrl);
                        setIsCropperOpen(true);
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md"
                    >
                      <Crop className="w-3.5 h-3.5 mr-1" /> Edit Crop
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                  <span className="truncate max-w-[280px] font-mono">{form.imageUrl}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                  >
                    Change File
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer p-6 rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-all text-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Click to select banner image file
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Supports JPG, PNG, WebP • Selecting opens crop, zoom & rotation editor
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Direct URL Fallback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Destination Web Link (Optional)
            </label>
            <Input
              type="url"
              placeholder="https://sponsor.com or https://school.edu/marathon"
              value={form.targetUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, targetUrl: e.target.value }))
              }
            />
            <p className="text-[11px] text-slate-500 mt-1">
              When students tap the carousel banner inside the mobile app, this URL opens.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Display Sort Order
              </label>
              <Input
                type="number"
                min={1}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Slide is Active
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              {editingBanner ? "Update Slide" : "Save & Publish Slide"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Image Editor, Landscape Cropper, Zoom & Rotation */}
      <Modal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        title="Crop & Edit Banner Image"
        description="Position, scale, rotate, and select landscape aspect ratio for mobile slider display"
      >
        <div className="space-y-4">
          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Landscape Aspect Ratio:</span>
              <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
                {cropAspectRatio === 2.4
                  ? "2.4:1 (Recommended Mobile Slider)"
                  : cropAspectRatio === 16 / 9
                  ? "16:9 (Standard Widescreen)"
                  : cropAspectRatio === 2.0
                  ? "2:1 (Modern Mobile)"
                  : "4:3 (Compact Landscape)"}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "2.4 : 1", value: 2.4, desc: "Mobile Banner" },
                { label: "16 : 9", value: 16 / 9, desc: "Wide 16:9" },
                { label: "2 : 1", value: 2.0, desc: "Wide 2:1" },
                { label: "4 : 3", value: 4 / 3, desc: "Standard" },
              ].map((ratio) => (
                <button
                  key={ratio.label}
                  type="button"
                  onClick={() => setCropAspectRatio(ratio.value)}
                  className={`py-2 px-1 text-center rounded-lg border text-xs font-bold transition-all ${
                    Math.abs(cropAspectRatio - ratio.value) < 0.05
                      ? "border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/30"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div>{ratio.label}</div>
                  <div className="text-[10px] font-normal opacity-75">{ratio.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Crop Viewport Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-teal-600" />
                <span>Drag image to reposition framing</span>
              </span>
              <span>
                Zoom: <strong className="text-teal-600 font-mono">{cropZoom.toFixed(1)}x</strong> | Angle:{" "}
                <strong className="text-teal-600 font-mono">{cropRotation}°</strong>
              </span>
            </div>

            <div
              ref={previewBoxRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="relative w-full overflow-hidden rounded-xl bg-slate-950 border-2 border-teal-500/50 shadow-inner select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
              style={{
                aspectRatio: `${cropAspectRatio}`,
                maxHeight: "320px",
              }}
            >
              {rawImageSrc && (
                <img
                  ref={imgRef}
                  src={rawImageSrc}
                  alt="Crop Preview"
                  draggable={false}
                  className="pointer-events-none max-w-none transition-transform duration-75"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) rotate(${cropRotation}deg) scale(${cropZoom})`,
                    transformOrigin: "center center",
                  }}
                />
              )}

              {/* Rule of Thirds Crop Overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>

              {/* Viewport badge */}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 pointer-events-none">
                <Crop className="w-3 h-3 text-teal-400" />
                <span>Mobile Carousel Crop Area</span>
              </div>
            </div>
          </div>

          {/* Controls: Zoom & Rotate Toolbar */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            {/* Zoom Slider & Buttons */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 shrink-0">
                Zoom:
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCropZoom((prev) => Math.max(1, prev - 0.2))}
                className="h-8 w-8 p-0"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <input
                type="range"
                min="1"
                max="3.5"
                step="0.05"
                value={cropZoom}
                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                className="flex-1 accent-teal-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCropZoom((prev) => Math.min(3.5, prev + 0.2))}
                className="h-8 w-8 p-0"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono font-bold text-teal-600 w-10 text-right">
                {cropZoom.toFixed(1)}x
              </span>
            </div>

            {/* Rotate & Reset Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rotate:
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCropRotation((prev) => (prev - 90 + 360) % 360)
                  }
                  className="h-8 text-xs font-semibold gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> -90°
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCropRotation((prev) => (prev + 90) % 360)
                  }
                  className="h-8 text-xs font-semibold gap-1"
                >
                  <RotateCw className="w-3.5 h-3.5" /> +90°
                </Button>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {cropRotation}°
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCropZoom(1);
                  setCropRotation(0);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="h-8 text-xs gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <RefreshCw className="w-3 h-3" /> Reset Crop
              </Button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              disabled={isUploadingCrop}
              onClick={() => setIsCropperOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isUploadingCrop}
              onClick={handleSaveCroppedImage}
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs gap-1.5"
            >
              {isUploadingCrop ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Storing Cropped Image...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply & Store Cropped Image</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
