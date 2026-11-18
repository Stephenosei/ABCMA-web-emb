import React, { useState, useEffect, useCallback } from 'react';
import { PhoneCall, Settings, CheckCircle2, Eye, Image as ImageIcon } from 'lucide-react';
import { supabase, logAdminActivity } from '../../../lib/supabase';
import { CmsWebsiteSettings } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms, DEFAULT_WEBSITE_SETTINGS } from '../../../context/CmsContext';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';

interface ContactSettingsManagerProps {
  mode: 'contact' | 'settings';
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const ContactSettingsManager: React.FC<ContactSettingsManagerProps> = ({
  mode,
  notify,
}) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [settings, setSettings] = useState<CmsWebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [phonesText, setPhonesText] = useState('0302-228-900, 0302-228-901');
  const [emailsText, setEmailsText] = useState('info@abcma.gov.gh, support@abcma.gov.gh');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pickerTarget, setPickerTarget] = useState<'logo' | 'favicon' | 'ogImage' | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('website_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) {
      notify(error.message, 'error');
    } else if (data) {
      const merged: CmsWebsiteSettings = {
        ...DEFAULT_WEBSITE_SETTINGS,
        ...data,
        social_links: {
          ...DEFAULT_WEBSITE_SETTINGS.social_links,
          ...(data.social_links || {}),
        },
        seo_metadata: {
          ...DEFAULT_WEBSITE_SETTINGS.seo_metadata,
          ...(data.seo_metadata || {}),
        },
      };
      setSettings(merged);
      setPhonesText((merged.contact_phones || []).join(', '));
      setEmailsText((merged.contact_emails || []).join(', '));
    }
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (targetStatus: 'draft' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!canPublishOrDelete) {
      notify('Only Content Administrators and Super Administrators can modify site settings.', 'error');
      return;
    }

    setSaving(true);
    const contactPhones = phonesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const contactEmails = emailsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const payload =
        mode === 'contact'
          ? {
              contact_phones: contactPhones,
              contact_emails: contactEmails,
              office_location: settings.office_location.trim(),
              postal_address: settings.postal_address.trim(),
              gps_address: settings.gps_address.trim(),
              working_hours: settings.working_hours.trim(),
              google_maps_url: settings.google_maps_url.trim(),
              social_links: settings.social_links,
              status: targetStatus,
            }
          : {
              site_title: settings.site_title.trim(),
              site_description: settings.site_description.trim(),
              logo_url: settings.logo_url.trim(),
              favicon_url: settings.favicon_url.trim(),
              footer_text: settings.footer_text.trim(),
              copyright_text: settings.copyright_text.trim(),
              social_links: settings.social_links,
              seo_metadata: settings.seo_metadata,
              status: targetStatus,
            };

      const { error } = await supabase.from('website_settings').update(payload).eq('id', 1);
      if (error) throw error;

      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: mode === 'contact' ? 'UPDATE_CONTACT_INFO' : 'UPDATE_WEBSITE_SETTINGS',
        entityType: 'website_settings',
        entityId: '1',
        entityLabel: `${mode === 'contact' ? 'Contact Info' : 'Website Settings'} (${targetStatus})`,
      });

      notify(
        targetStatus === 'published'
          ? 'Settings published live across the public website.'
          : 'Settings saved as draft.'
      );
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          {mode === 'contact' ? (
            <PhoneCall className="w-5 h-5 text-emerald-700" />
          ) : (
            <Settings className="w-5 h-5 text-emerald-700" />
          )}
          <span>{mode === 'contact' ? 'Contact Information' : 'Website Settings & Branding'}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {mode === 'contact'
            ? 'Updates reflect across the Header hotline bar, Footer contact block, and The Assembly page.'
            : 'Configure the official website logo, favicon, SEO metadata, footer copy, and social channels.'}
        </p>
      </div>

      {mode === 'contact' ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assembly Telephone Numbers (comma separated)
              </label>
              <input
                type="text"
                value={phonesText}
                onChange={(e) => setPhonesText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Email Addresses (comma separated)
              </label>
              <input
                type="text"
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Physical Office Location
              </label>
              <input
                type="text"
                value={settings.office_location}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, office_location: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Postal Address
              </label>
              <input
                type="text"
                value={settings.postal_address}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, postal_address: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                GhanaPostGPS Digital Address
              </label>
              <input
                type="text"
                value={settings.gps_address}
                onChange={(e) => setSettings((prev) => ({ ...prev, gps_address: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Office Working Hours
              </label>
              <input
                type="text"
                value={settings.working_hours}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, working_hours: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Google Maps Location Link
              </label>
              <input
                type="url"
                value={settings.google_maps_url}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, google_maps_url: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['facebook', 'twitter', 'instagram', 'youtube'] as const).map((net) => (
                <div key={net}>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 capitalize">
                    {net} URL
                  </label>
                  <input
                    type="url"
                    value={settings.social_links[net] || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        social_links: { ...prev.social_links, [net]: e.target.value },
                      }))
                    }
                    placeholder={`https://${net}.com/abcma`}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-contain bg-white border border-slate-200"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">Website Logo</div>
                  <div className="text-[11px] text-slate-500">Header & Footer Crest</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget('logo')}
                className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Change Logo
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={settings.favicon_url}
                  alt="Favicon"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900">Browser Favicon</div>
                  <div className="text-[11px] text-slate-500">Tab Icon</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget('favicon')}
                className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Change Favicon
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Website Title
              </label>
              <input
                type="text"
                value={settings.site_title}
                onChange={(e) => setSettings((p) => ({ ...p, site_title: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Website Description & SEO Meta Description
              </label>
              <textarea
                rows={2}
                value={settings.site_description}
                onChange={(e) => setSettings((p) => ({ ...p, site_description: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Footer Description Text
              </label>
              <textarea
                rows={2}
                value={settings.footer_text}
                onChange={(e) => setSettings((p) => ({ ...p, footer_text: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Copyright Text
              </label>
              <input
                type="text"
                value={settings.copyright_text}
                onChange={(e) => setSettings((p) => ({ ...p, copyright_text: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                SEO Keywords (comma separated)
              </label>
              <input
                type="text"
                value={settings.seo_metadata.keywords || ''}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    seo_metadata: { ...p.seo_metadata, keywords: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                OpenGraph Share Image
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings.seo_metadata.ogImage || ''}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      seo_metadata: { ...p.seo_metadata, ogImage: e.target.value },
                    }))
                  }
                  className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setPickerTarget('ogImage')}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Pick</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Footer Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={saving || !canPublishOrDelete}
            onClick={() => handleSave('draft')}
            className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving || !canPublishOrDelete}
            onClick={() => handleSave('published')}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Publish Changes'}</span>
          </button>
        </div>
      </div>

      <MediaPickerModal
        isOpen={Boolean(pickerTarget)}
        acceptKind="image"
        defaultFolder="banners"
        onClose={() => setPickerTarget(null)}
        onSelect={(asset) => {
          if (pickerTarget === 'logo') {
            setSettings((p) => ({ ...p, logo_url: asset.public_url }));
          } else if (pickerTarget === 'favicon') {
            setSettings((p) => ({ ...p, favicon_url: asset.public_url }));
          } else if (pickerTarget === 'ogImage') {
            setSettings((p) => ({
              ...p,
              seo_metadata: { ...p.seo_metadata, ogImage: asset.public_url },
            }));
          }
          setPickerTarget(null);
        }}
      />

      <PreviewModal
        isOpen={previewOpen}
        title={settings.site_title}
        subtitle={mode === 'contact' ? 'Contact & Hotline Directory' : 'Portal Identity & SEO'}
        imageUrl={settings.logo_url}
        metaTags={[
          { label: 'Hotlines', value: phonesText },
          { label: 'Emails', value: emailsText },
          { label: 'Office Location', value: settings.office_location },
          { label: 'Working Hours', value: settings.working_hours },
        ]}
        paragraphs={[settings.site_description, settings.footer_text, settings.copyright_text]}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};
