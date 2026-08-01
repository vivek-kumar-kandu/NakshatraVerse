import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CosmicBg from "../components/common/CosmicBg.jsx";
import GlassCard from "../components/common/GlassCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import SkeletonList from "../components/common/Skeleton.jsx";
import ProfileCard from "../components/family/ProfileCard.jsx";
import ProfileFormDialog from "../components/family/ProfileFormDialog.jsx";
import { RELATIONSHIPS } from "../utils/familyProfileConstants.js";
import * as familyProfilesApi from "../utils/familyProfilesApi.js";
import { useToast } from "../components/common/Toast.jsx";
import { GOLD_GRADIENT } from "../constants/astrology.js";
import { readPreferences, writePreferences } from "../utils/settingsStorage.js";

// ─────────────────────────────────────────────────────────────────────────
// FamilyProfilesPage (V4.2 — Family Profiles & Relationship Hub)
//
// Fully self-contained module, reached from Dashboard/CommandPalette/
// ActionDock — same "no existing chart/report context required" shape as
// MatchingPage.jsx/PanchangPage.jsx. Owns Family Profile CRUD (add, edit,
// delete, duplicate, archive, restore), search/filter/sort, and a
// "Recently Opened" rail.
//
// "Open" a profile (Birth Report/Horoscope/Calendar/AI Assistant, etc.)
// is NOT reimplemented here — `onGenerateReport` is the exact same
// `handleFormSubmit` App.jsx already passes to LandingPage, so opening a
// saved profile runs through the identical, completely unmodified report-
// generation → ResultsPage → ActionDock (Horoscope/Calendar/AI Assistant/
// PDF Export) pipeline as typing the birth data in by hand. This file only
// supplies that pipeline with a stored profile's birth data instead of a
// freshly-submitted form.
// ─────────────────────────────────────────────────────────────────────────

const SORTS = ["recent", "name", "relationship", "dob"];

function FamilyProfilesPage({ onNavigate, onGenerateReport, onOpenRelationshipHub }) {
  const { t } = useTranslation(["family", "common"]);
  const toast = useToast();
  const [profiles, setProfiles] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [showArchived, setShowArchived] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    familyProfilesApi.listProfiles({
      search, relationship: relationshipFilter, sort, includeArchived: showArchived,
    })
      .then(setProfiles)
      .catch((err) => setError(err.message || t("family:profilesPage.loadFailed")));
    familyProfilesApi.getRecentlyOpened(5).then(setRecent).catch(() => setRecent([]));
  }, [search, relationshipFilter, sort, showArchived]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = () => { setEditingProfile(null); setDialogOpen(true); };
  const handleEdit = (p) => { setEditingProfile(p); setDialogOpen(true); };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editingProfile) {
        await familyProfilesApi.updateProfile(editingProfile.id, form);
        toast?.success?.(t("family:profilesPage.toasts.updated", { name: form.name }));
      } else {
        await familyProfilesApi.createProfile(form);
        toast?.success?.(t("family:profilesPage.toasts.added", { name: form.name }));
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast?.error?.(err.message || t("family:profilesPage.toasts.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (p) => {
    try {
      await familyProfilesApi.duplicateProfile(p.id);
      toast?.success?.(t("family:profilesPage.toasts.duplicated", { name: p.name }));
      load();
    } catch (err) {
      toast?.error?.(err.message || t("family:profilesPage.toasts.duplicateFailed"));
    }
  };

  const handleArchive = async (p) => {
    try {
      await familyProfilesApi.archiveProfile(p.id);
      toast?.info?.(t("family:profilesPage.toasts.archived", { name: p.name }));
      load();
    } catch (err) {
      toast?.error?.(err.message || t("family:profilesPage.toasts.archiveFailed"));
    }
  };

  const handleRestore = async (p) => {
    try {
      await familyProfilesApi.restoreProfile(p.id);
      toast?.success?.(t("family:profilesPage.toasts.restored", { name: p.name }));
      load();
    } catch (err) {
      toast?.error?.(err.message || t("family:profilesPage.toasts.restoreFailed"));
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await familyProfilesApi.deleteProfile(confirmDelete.id);
      toast?.info?.(t("family:profilesPage.toasts.deleted", { name: confirmDelete.name }));
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast?.error?.(err.message || t("family:profilesPage.toasts.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  // "Open" a profile: mark it recently-opened, then hand its birth data to
  // the existing, unmodified report-generation pipeline (onGenerateReport
  // === App.jsx's handleFormSubmit). Every downstream feature (Horoscope,
  // Calendar, AI Assistant, PDF Export) is reached from there exactly as
  // it already is for a freshly-typed reading.
  const handleOpen = useCallback((p) => {
    familyProfilesApi.touchProfile(p.id).catch(() => {});
    try { writePreferences({ activeProfileId: p.id }); } catch { /* storage unavailable — non-fatal */ }
    onGenerateReport({ name: p.name, dob: p.dob, tob: p.tob, pob: p.pob });
  }, [onGenerateReport]);

  const handleCompare = useCallback((p) => {
    try { writePreferences({ activeProfileId: p.id }); } catch { /* storage unavailable — non-fatal */ }
    onOpenRelationshipHub(p.id);
  }, [onOpenRelationshipHub]);

  // Header "Relationship Hub" button (no specific profile card involved) —
  // falls back to whichever profile was last active, so returning users
  // aren't forced to re-pick a profile they were just working with.
  const handleOpenRelationshipHubFromHeader = useCallback(() => {
    let lastActiveId = null;
    try { lastActiveId = readPreferences().activeProfileId; } catch { /* storage unavailable — non-fatal */ }
    onOpenRelationshipHub(lastActiveId || undefined);
  }, [onOpenRelationshipHub]);

  const emptyMessage = useMemo(() => {
    if (search || relationshipFilter !== "all") return t("family:profilesPage.emptyMessageFiltered");
    return t("family:profilesPage.emptyMessageDefault");
  }, [search, relationshipFilter, t]);

  return (
    <div style={{ minHeight: "100vh", position: "relative", fontFamily: "Inter,sans-serif" }}>
      <CosmicBg animated />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "84px 16px 70px" }}>

        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
          <div>
            <button
              onClick={() => onNavigate("dashboard")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 8, color: "var(--nv-text-secondary, rgba(200,160,255,0.75))", fontSize: 12.5, fontFamily: "Inter,sans-serif" }}
            >
              {t("family:profilesPage.backToDashboard")}
            </button>
            <h1 style={{ margin: 0, fontSize: "clamp(22px,4vw,30px)", background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif", fontWeight: 700 }}>
              {t("family:profilesPage.title")}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--nv-text-muted, rgba(200,160,255,0.65))" }}>
              {t("family:profilesPage.subtitle")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleOpenRelationshipHubFromHeader}
              className="pill-btn tap-scale"
              style={{ padding: "12px 20px", borderRadius: 24, border: "1px solid rgba(180,120,255,0.4)", background: "rgba(123,47,255,0.18)", color: "var(--nv-text-primary, #e8d5ff)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "Cinzel,serif" }}
            >
              {t("family:profilesPage.relationshipHub")}
            </button>
            <button
              onClick={handleAdd}
              className="submit-btn"
              style={{ padding: "13px 24px", borderRadius: 30, border: "1px solid rgba(180,120,255,0.45)", background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "Cinzel,serif", boxShadow: "0 4px 20px rgba(123,47,255,0.35)" }}
            >
              {t("family:profilesPage.addProfile")}
            </button>
          </div>
        </header>

        {error && (
          <GlassCard role="alert" style={{ padding: "16px 20px", marginBottom: 20, border: "1px solid rgba(255,100,100,0.3)" }}>
            <p style={{ margin: 0, color: "var(--nv-danger, #ff8888)", fontSize: 13 }}>{error}</p>
          </GlassCard>
        )}

        {recent.length > 0 && !showArchived && (
          <section style={{ marginBottom: 30 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>{t("family:profilesPage.recentlyOpened")}</h2>
            <div className="tab-scroll-region" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }}>
              {recent.map((p) => (
                <div key={p.id} style={{ minWidth: 260, flex: "0 0 auto" }}>
                  <ProfileCard profile={p} onOpen={handleOpen} onEdit={handleEdit} onDuplicate={handleDuplicate} onArchive={handleArchive} onDelete={setConfirmDelete} onCompare={handleCompare} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("family:profilesPage.searchPlaceholder")}
            aria-label={t("family:profilesPage.searchAriaLabel")}
            style={{ flex: "1 1 220px", minWidth: 180, padding: "10px 16px", borderRadius: 20, fontSize: 13, border: "1px solid rgba(180,120,255,0.3)", background: "rgba(18,0,38,0.6)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
          />
          <select
            value={relationshipFilter}
            onChange={(e) => setRelationshipFilter(e.target.value)}
            aria-label={t("family:profilesPage.filterAriaLabel")}
            className="select-input"
            style={{ padding: "10px 14px", borderRadius: 20, fontSize: 12.5, cursor: "pointer", border: "1px solid rgba(180,120,255,0.3)", background: "rgba(18,0,38,0.6)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
          >
            <option value="all">{t("family:profilesPage.allRelationships")}</option>
            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{t(`family:relationships.${r}`)}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label={t("family:profilesPage.sortAriaLabel")}
            className="select-input"
            style={{ padding: "10px 14px", borderRadius: 20, fontSize: 12.5, cursor: "pointer", border: "1px solid rgba(180,120,255,0.3)", background: "rgba(18,0,38,0.6)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
          >
            {SORTS.map((sv) => <option key={sv} value={sv}>{t(`family:sort.${sv}`)}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            {t("family:profilesPage.showArchived")}
          </label>
        </section>

        {profiles === null && !error && <SkeletonList rows={4} variant="card" />}

        {profiles?.length === 0 && (
          <EmptyState icon="👨‍👩‍👧‍👦" title={t("family:profilesPage.emptyTitle")} message={emptyMessage} actionLabel={search || relationshipFilter !== "all" ? undefined : t("family:profilesPage.addProfile")} onAction={search || relationshipFilter !== "all" ? undefined : handleAdd} />
        )}

        {profiles?.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {profiles.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                onOpen={handleOpen}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onArchive={p.archived ? undefined : handleArchive}
                onRestore={p.archived ? handleRestore : undefined}
                onDelete={setConfirmDelete}
                onCompare={handleCompare}
              />
            ))}
          </div>
        )}
      </div>

      <ProfileFormDialog
        open={dialogOpen}
        initialProfile={editingProfile}
        onSave={handleSave}
        onCancel={() => setDialogOpen(false)}
        saving={saving}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={t("family:profilesPage.deleteDialog.title")}
        message={t("family:profilesPage.deleteDialog.message", { name: confirmDelete?.name })}
        confirmLabel={t("family:profilesPage.deleteDialog.confirmLabel")}
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

export default FamilyProfilesPage;
