import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Navigation,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  Image as ImageIcon,
  Edit3,
} from 'lucide-react';
import { supabase, logAdminActivity } from '../../../lib/supabase';
import {
  CmsNavigationItem,
  CmsPage,
  CmsWebsiteSettings,
  HomepageBanner,
  HomepageHighlight,
  HomepageStat,
} from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms, DEFAULT_WEBSITE_SETTINGS } from '../../../context/CmsContext';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';
import { ConfirmDialog } from '../ConfirmDialog';
import { sanitizeUrl, toSafeErrorMessage } from '../../../utils/security';

interface HomepageNavigationManagerProps {
  mode: 'homepage' | 'navigation';
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const HomepageNavigationManager: React.FC<HomepageNavigationManagerProps> = ({
  mode,
  notify,
}) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  // Homepage state
  const [settings, setSettings] = useState<CmsWebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [loadingHome, setLoadingHome] = useState(true);
  const [savingHome, setSavingHome] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'hero' | { bannerIdx: number } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Navigation state
  const [navItems, setNavItems] = useState<CmsNavigationItem[]>([]);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loadingNav, setLoadingNav] = useState(true);
  const [editingNav, setEditingNav] = useState<CmsNavigationItem | null>(null);
  const [navForm, setNavForm] = useState({
    label: '',
    target_type: 'section' as CmsNavigationItem['target_type'],
    target_value: 'home',
    parent_id: '',
    is_visible: true,
  });
  const [deleteNavTarget, setDeleteNavTarget] = useState<CmsNavigationItem | null>(null);

  const loadHomepage = useCallback(async () => {
    if (!supabase) {
      setLoadingHome(false);
      return;
    }
    setLoadingHome(true);
    const { data, error } = await supabase
      .from('website_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) notify(toSafeErrorMessage(error, 'Failed to load homepage settings.'), 'error');
    else if (data) {
      setSettings({
        ...DEFAULT_WEBSITE_SETTINGS,
        ...data,
        homepage_banners: Array.isArray(data.homepage_banners) ? data.homepage_banners : [],
        homepage_highlights: Array.isArray(data.homepage_highlights) ? data.homepage_highlights : [],
        homepage_stats:
          Array.isArray(data.homepage_stats) && data.homepage_stats.length > 0
            ? data.homepage_stats
            : DEFAULT_WEBSITE_SETTINGS.homepage_stats,
      });
    }
    setLoadingHome(false);
  }, [notify]);

  const loadNavigation = useCallback(async () => {
    if (!supabase) {
      setLoadingNav(false);
      return;
    }
    setLoadingNav(true);
    const [navRes, pageRes] = await Promise.all([
      supabase.from('navigation_items').select('*').order('sort_order', { ascending: true }),
      supabase.from('pages').select('*').order('title', { ascending: true }),
    ]);
    if (navRes.error) notify(toSafeErrorMessage(navRes.error, 'Failed to load navigation items.'), 'error');
    else if (navRes.data) setNavItems(navRes.data as CmsNavigationItem[]);
    if (pageRes.data) setPages(pageRes.data as CmsPage[]);
    setLoadingNav(false);
  }, [notify]);

  useEffect(() => {
    if (mode === 'homepage') loadHomepage();
    else loadNavigation();
  }, [mode, loadHomepage, loadNavigation]);

  // -------------------- HOMEPAGE HANDLERS --------------------
  const saveHomepage = async (targetStatus: 'draft' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!canPublishOrDelete) {
      notify('Only Content Administrators and Super Administrators can update homepage settings.', 'error');
      return;
    }

    setSavingHome(true);
    try {
      const safeHeroImg = settings.hero_image_url.trim()
        ? sanitizeUrl(settings.hero_image_url.trim(), {
            allowRelative: true,
            allowHash: false,
            allowMailtoTel: false,
          })
        : '';
      const cleanBanners = settings.homepage_banners.map((b) => ({
        ...b,
        imageUrl: b.imageUrl
          ? sanitizeUrl(b.imageUrl, {
              allowRelative: true,
              allowHash: false,
              allowMailtoTel: false,
            })
          : '',
      }));

      const payload = {
        hero_heading: settings.hero_heading.trim(),
        hero_subheading: settings.hero_subheading.trim(),
        welcome_message: settings.welcome_message.trim(),
        hero_image_url: safeHeroImg,
        homepage_banners: cleanBanners,
        homepage_highlights: settings.homepage_highlights,
        homepage_cta: settings.homepage_cta,
        homepage_stats: settings.homepage_stats,
        status: targetStatus,
      };
      const { error } = await supabase.from('website_settings').update(payload).eq('id', 1);
      if (error) throw error;

      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: targetStatus === 'published' ? 'PUBLISH_HOMEPAGE' : 'SAVE_HOMEPAGE_DRAFT',
        entityType: 'website_settings',
        entityId: '1',
        entityLabel: `Homepage Configuration (${targetStatus})`,
        updatedValues: { hero_heading: payload.hero_heading, status: targetStatus },
      });

      notify(
        targetStatus === 'published'
          ? 'Homepage content published live to public portal.'
          : 'Homepage configuration saved as draft.'
      );
      await refreshPublicContent();
    } catch (err) {
      notify(toSafeErrorMessage(err, 'Failed to save homepage.'), 'error');
    } finally {
      setSavingHome(false);
    }
  };

  const addBanner = () => {
    const next: HomepageBanner = {
      id: `ban-${Date.now()}`,
      title: '2026 Business Operating Permit Renewal',
      subtitle: 'Pay via Mobile Money or Card with instant QR-verified e-receipt.',
      imageUrl: '/images/acma_civic_headquarters_1794370608615.jpg',
      ctaLabel: 'Pay Rates Online',
      ctaTarget: 'service',
    };
    setSettings((prev) => ({
      ...prev,
      homepage_banners: [...prev.homepage_banners, next],
    }));
  };

  const addHighlight = () => {
    const next: HomepageHighlight = {
      id: `hl-${Date.now()}`,
      title: 'Flood Mitigation Desilting Drive',
      description: 'Ongoing clearing of primary storm drains across Abossey Okai and Mataheko.',
      badge: 'Highlight',
      targetPage: 'projects',
    };
    setSettings((prev) => ({
      ...prev,
      homepage_highlights: [...prev.homepage_highlights, next],
    }));
  };

  const updateStat = (idx: number, field: keyof HomepageStat, val: string) => {
    setSettings((prev) => ({
      ...prev,
      homepage_stats: prev.homepage_stats.map((st, i) => (i === idx ? { ...st, [field]: val } : st)),
    }));
  };

  // -------------------- NAVIGATION HANDLERS --------------------
  const handleSaveNavItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !adminProfile) return;
    if (!canPublishOrDelete) {
      notify('Only Content or Super Administrators can edit navigation menus.', 'error');
      return;
    }
    if (!navForm.label.trim() || !navForm.target_value.trim()) {
      notify('Menu label and destination are required.', 'error');
      return;
    }

    let resolvedTargetValue = navForm.target_value.trim();
    if (navForm.target_type === 'external') {
      const validatedExternalUrl = sanitizeUrl(resolvedTargetValue, {
        allowRelative: false,
        allowHash: false,
        allowMailtoTel: false,
      });
      if (!validatedExternalUrl) {
        notify('External navigation URL must start with https:// or http://.', 'error');
        return;
      }
      resolvedTargetValue = validatedExternalUrl;
    }

    try {
      if (editingNav) {
        const { error } = await supabase
          .from('navigation_items')
          .update({
            label: navForm.label.trim(),
            target_type: navForm.target_type,
            target_value: resolvedTargetValue,
            parent_id: navForm.parent_id || null,
            is_visible: navForm.is_visible,
          })
          .eq('id', editingNav.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UPDATE_NAVIGATION_ITEM',
          entityType: 'navigation_items',
          entityId: editingNav.id,
          entityLabel: navForm.label.trim(),
        });
        notify(`Updated menu item "${navForm.label.trim()}".`);
      } else {
        const nextOrder = navItems.length > 0 ? Math.max(...navItems.map((n) => n.sort_order)) + 1 : 1;
        const { data, error } = await supabase
          .from('navigation_items')
          .insert({
            label: navForm.label.trim(),
            target_type: navForm.target_type,
            target_value: resolvedTargetValue,
            parent_id: navForm.parent_id || null,
            sort_order: nextOrder,
            is_visible: navForm.is_visible,
          })
          .select('id')
          .single();
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'CREATE_NAVIGATION_ITEM',
          entityType: 'navigation_items',
          entityId: data?.id || '',
          entityLabel: navForm.label.trim(),
        });
        notify(`Added menu item "${navForm.label.trim()}".`);
      }

      setEditingNav(null);
      setNavForm({
        label: '',
        target_type: 'section',
        target_value: 'home',
        parent_id: '',
        is_visible: true,
      });
      await loadNavigation();
      await refreshPublicContent();
    } catch (err) {
      notify(toSafeErrorMessage(err, 'Failed to save navigation item.'), 'error');
    }
  };

  const handleMoveNav = async (index: number, dir: -1 | 1) => {
    if (!supabase || !canPublishOrDelete) return;
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= navItems.length) return;

    const a = navItems[index];
    const b = navItems[swapIdx];

    await Promise.all([
      supabase.from('navigation_items').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('navigation_items').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);

    await loadNavigation();
    await refreshPublicContent();
  };

  const handleToggleNavVisible = async (item: CmsNavigationItem) => {
    if (!supabase || !canPublishOrDelete) return;
    await supabase
      .from('navigation_items')
      .update({ is_visible: !item.is_visible })
      .eq('id', item.id);
    await loadNavigation();
    await refreshPublicContent();
  };

  const handleConfirmDeleteNav = async () => {
    if (!deleteNavTarget || !supabase || !adminProfile) return;
    const { error } = await supabase.from('navigation_items').delete().eq('id', deleteNavTarget.id);
    if (error) {
      notify(toSafeErrorMessage(error, 'Failed to remove navigation item.'), 'error');
      return;
    }
    await logAdminActivity({
      adminId: adminProfile.id,
      adminEmail: adminProfile.email,
      adminName: adminProfile.full_name,
      action: 'DELETE_NAVIGATION_ITEM',
      entityType: 'navigation_items',
      entityId: deleteNavTarget.id,
      entityLabel: deleteNavTarget.label,
    });
    notify(`Removed navigation item "${deleteNavTarget.label}".`);
    setDeleteNavTarget(null);
    await loadNavigation();
    await refreshPublicContent();
  };

  if (mode === 'homepage') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-700" />
            <span>Homepage Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize hero headings, welcome copy, background image, homepage banners, highlights, CTA links, and KPI statistics.
          </p>
        </div>

        {loadingHome ? (
          <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            Loading homepage settings...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Headings & Welcome Message */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Hero Welcome Section</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hero Eyebrow / Subheading
                  </label>
                  <input
                    type="text"
                    value={settings.hero_subheading}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, hero_subheading: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Main Hero Heading
                  </label>
                  <input
                    type="text"
                    value={settings.hero_heading}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, hero_heading: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Welcome Message
                </label>
                <textarea
                  rows={3}
                  value={settings.welcome_message}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, welcome_message: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {settings.hero_image_url ? (
                    <img
                      src={settings.hero_image_url}
                      alt="Hero background"
                      referrerPolicy="no-referrer"
                      className="w-24 h-14 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-24 h-14 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <div className="text-xs">
                    <div className="font-semibold text-slate-800">Hero Background Image</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                      {settings.hero_image_url}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerTarget('hero')}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:border-emerald-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Change Hero Photo
                </button>
              </div>
            </div>

            {/* Call to Action & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Call-To-Action Buttons</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Primary CTA Label
                    </label>
                    <input
                      type="text"
                      value={settings.homepage_cta.primaryLabel}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          homepage_cta: { ...prev.homepage_cta, primaryLabel: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Primary Destination
                    </label>
                    <input
                      type="text"
                      value={settings.homepage_cta.primaryTarget}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          homepage_cta: { ...prev.homepage_cta, primaryTarget: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Secondary CTA Label
                    </label>
                    <input
                      type="text"
                      value={settings.homepage_cta.secondaryLabel}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          homepage_cta: { ...prev.homepage_cta, secondaryLabel: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Secondary Destination
                    </label>
                    <input
                      type="text"
                      value={settings.homepage_cta.secondaryTarget}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          homepage_cta: { ...prev.homepage_cta, secondaryTarget: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Homepage KPI Trust Strip (4 Metrics)</h2>
                <div className="space-y-2.5">
                  {settings.homepage_stats.slice(0, 4).map((st, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={st.value}
                        onChange={(e) => updateStat(idx, 'value', e.target.value)}
                        placeholder="Value"
                        className="px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={st.label}
                        onChange={(e) => updateStat(idx, 'label', e.target.value)}
                        placeholder="Label"
                        className="col-span-2 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Banners Manager */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Homepage Promotional Banners</h2>
                  <p className="text-[11px] text-slate-500">
                    Add optional spotlight banners shown below the Hero on the public homepage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addBanner}
                  className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Banner</span>
                </button>
              </div>

              {settings.homepage_banners.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No extra homepage banners configured.
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.homepage_banners.map((ban, idx) => (
                    <div
                      key={ban.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                    >
                      <div className="md:col-span-2">
                        <img
                          src={ban.imageUrl}
                          alt={ban.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setPickerTarget({ bannerIdx: idx })}
                          className="w-full mt-1 text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                        >
                          Change Photo
                        </button>
                      </div>
                      <div className="md:col-span-4 space-y-2">
                        <input
                          type="text"
                          value={ban.title}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              homepage_banners: prev.homepage_banners.map((b, i) =>
                                i === idx ? { ...b, title: e.target.value } : b
                              ),
                            }))
                          }
                          placeholder="Banner title"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                        <input
                          type="text"
                          value={ban.subtitle}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              homepage_banners: prev.homepage_banners.map((b, i) =>
                                i === idx ? { ...b, subtitle: e.target.value } : b
                              ),
                            }))
                          }
                          placeholder="Subtitle"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-5 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={ban.ctaLabel}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              homepage_banners: prev.homepage_banners.map((b, i) =>
                                i === idx ? { ...b, ctaLabel: e.target.value } : b
                              ),
                            }))
                          }
                          placeholder="Button Label"
                          className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                        <input
                          type="text"
                          value={ban.ctaTarget}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              homepage_banners: prev.homepage_banners.map((b, i) =>
                                i === idx ? { ...b, ctaTarget: e.target.value } : b
                              ),
                            }))
                          }
                          placeholder="Target section/url"
                          className="px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              homepage_banners: prev.homepage_banners.filter((_, i) => i !== idx),
                            }))
                          }
                          className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Highlights Manager */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Homepage Highlights</h2>
                  <p className="text-[11px] text-slate-500">
                    Curated municipal highlights displayed on the homepage strip.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addHighlight}
                  className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Highlight</span>
                </button>
              </div>

              {settings.homepage_highlights.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No custom highlights added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.homepage_highlights.map((hl, idx) => (
                    <div
                      key={hl.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center"
                    >
                      <input
                        type="text"
                        value={hl.badge}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            homepage_highlights: prev.homepage_highlights.map((h, i) =>
                              i === idx ? { ...h, badge: e.target.value } : h
                            ),
                          }))
                        }
                        placeholder="Badge"
                        className="md:col-span-2 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={hl.title}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            homepage_highlights: prev.homepage_highlights.map((h, i) =>
                              i === idx ? { ...h, title: e.target.value } : h
                            ),
                          }))
                        }
                        placeholder="Title"
                        className="md:col-span-3 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={hl.description}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            homepage_highlights: prev.homepage_highlights.map((h, i) =>
                              i === idx ? { ...h, description: e.target.value } : h
                            ),
                          }))
                        }
                        placeholder="Description"
                        className="md:col-span-4 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={hl.targetPage}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            homepage_highlights: prev.homepage_highlights.map((h, i) =>
                              i === idx ? { ...h, targetPage: e.target.value } : h
                            ),
                          }))
                        }
                        placeholder="Target (e.g. service)"
                        className="md:col-span-2 px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            homepage_highlights: prev.homepage_highlights.filter((_, i) => i !== idx),
                          }))
                        }
                        className="md:col-span-1 p-1.5 text-slate-400 hover:text-rose-600 justify-self-end cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Homepage</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={savingHome || !canPublishOrDelete}
                  onClick={() => saveHomepage('draft')}
                  className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={savingHome || !canPublishOrDelete}
                  onClick={() => saveHomepage('published')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{savingHome ? 'Saving...' : 'Publish Homepage'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <MediaPickerModal
          isOpen={Boolean(pickerTarget)}
          acceptKind="image"
          defaultFolder="banners"
          onClose={() => setPickerTarget(null)}
          onSelect={(asset) => {
            if (pickerTarget === 'hero') {
              setSettings((prev) => ({ ...prev, hero_image_url: asset.public_url }));
            } else if (pickerTarget && typeof pickerTarget === 'object') {
              const targetIdx = pickerTarget.bannerIdx;
              setSettings((prev) => ({
                ...prev,
                homepage_banners: prev.homepage_banners.map((b, i) =>
                  i === targetIdx ? { ...b, imageUrl: asset.public_url } : b
                ),
              }));
            }
            setPickerTarget(null);
          }}
        />

        <PreviewModal
          isOpen={previewOpen}
          title={settings.hero_heading}
          subtitle={settings.hero_subheading}
          imageUrl={settings.hero_image_url}
          paragraphs={[settings.welcome_message]}
          metaTags={settings.homepage_stats.map((s) => ({ label: s.label, value: s.value }))}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    );
  }

  // -------------------- NAVIGATION MODE --------------------
  const topLevelItems = navItems.filter((n) => !n.parent_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-700" />
          <span>Navigation Management</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Add, edit, reorder, assign dropdowns, or toggle visibility of header menu links.
        </p>
      </div>

      {/* Add / Edit Navigation Form */}
      <form
        onSubmit={handleSaveNavItem}
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="text-xs font-bold text-slate-900">
          {editingNav ? `Editing "${editingNav.label}"` : 'Add Menu Item'}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Menu Label *</label>
            <input
              type="text"
              required
              value={navForm.label}
              onChange={(e) => setNavForm((p) => ({ ...p, label: e.target.value }))}
              placeholder="e.g. Citizen Charter"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Link Type</label>
            <select
              value={navForm.target_type}
              onChange={(e) =>
                setNavForm((p) => ({
                  ...p,
                  target_type: e.target.value as CmsNavigationItem['target_type'],
                }))
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            >
              <option value="section">Portal Section</option>
              <option value="page">Custom CMS Page</option>
              <option value="external">External URL</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Destination *</label>
            {navForm.target_type === 'page' && pages.length > 0 ? (
              <select
                value={navForm.target_value}
                onChange={(e) => setNavForm((p) => ({ ...p, target_value: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              >
                <option value="">-- Select CMS Page --</option>
                {pages.map((pg) => (
                  <option key={pg.id} value={pg.slug}>
                    /page/{pg.slug} ({pg.title})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={navForm.target_value}
                onChange={(e) => setNavForm((p) => ({ ...p, target_value: e.target.value }))}
                placeholder={
                  navForm.target_type === 'section'
                    ? 'home, news, departments...'
                    : navForm.target_type === 'page'
                    ? 'page-slug'
                    : 'https://...'
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Dropdown Parent
            </label>
            <select
              value={navForm.parent_id}
              onChange={(e) => setNavForm((p) => ({ ...p, parent_id: e.target.value }))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            >
              <option value="">Top-Level Menu</option>
              {topLevelItems
                .filter((i) => i.id !== editingNav?.id)
                .map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    Under: {parent.label}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={!canPublishOrDelete}
              className="flex-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
            >
              {editingNav ? 'Update' : 'Add Link'}
            </button>
            {editingNav && (
              <button
                type="button"
                onClick={() => {
                  setEditingNav(null);
                  setNavForm({
                    label: '',
                    target_type: 'section',
                    target_value: 'home',
                    parent_id: '',
                    is_visible: true,
                  });
                }}
                className="py-2 px-3 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Navigation Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loadingNav ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading navigation items...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Label</th>
                  <th className="py-3 px-4">Type & Destination</th>
                  <th className="py-3 px-4">Parent</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {navItems.map((item, idx) => {
                  const parentItem = navItems.find((p) => p.id === item.parent_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0 || !canPublishOrDelete}
                            onClick={() => handleMoveNav(idx, -1)}
                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === navItems.length - 1 || !canPublishOrDelete}
                            onClick={() => handleMoveNav(idx, 1)}
                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.parent_id ? `↳ ${item.label}` : item.label}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {item.target_type}: {item.target_value}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {parentItem ? parentItem.label : 'Top-Level'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          disabled={!canPublishOrDelete}
                          onClick={() => handleToggleNavVisible(item)}
                          className={`font-semibold cursor-pointer ${
                            item.is_visible ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {item.is_visible ? 'Visible' : 'Hidden'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNav(item);
                              setNavForm({
                                label: item.label,
                                target_type: item.target_type,
                                target_value: item.target_value,
                                parent_id: item.parent_id || '',
                                is_visible: item.is_visible,
                              });
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {canPublishOrDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteNavTarget(item)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteNavTarget)}
        title="Delete Navigation Item?"
        message={`Remove "${deleteNavTarget?.label}" from website navigation?`}
        confirmLabel="Remove"
        variant="danger"
        onCancel={() => setDeleteNavTarget(null)}
        onConfirm={handleConfirmDeleteNav}
      />
    </div>
  );
};
