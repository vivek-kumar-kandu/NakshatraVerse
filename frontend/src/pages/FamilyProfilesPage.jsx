import { useCallback, useEffect, useMemo, useState } from "react";
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

const SORTS = [
  { value: "recent", label: "Recently Updated" },
  { value: "name", label: "Name (A–Z)" },
  { value: "relationship", label: "Relationship" },
  { value: "dob", label: "Date of Birth" },
];

function FamilyProfilesPage({ onNavigate, onGenerateReport, onOpenRelationshipHub }) {
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
      .catch((err) => setError(err.message || "Could not load your family profiles."));
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
        toast?.success?.(`${form.name}'s profile updated.`);
      } else {
        await familyProfilesApi.createProfile(form);
        toast?.success?.(`${form.name} added to Family Profiles.`);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast?.error?.(err.message || "Could not save this profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (p) => {
    try {
      await familyProfilesApi.duplicateProfile(p.id);
      toast?.success?.(`Duplicated ${p.name}.`);
      load();
    } catch (err) {
      toast?.error?.(err.message || "Could not duplicate this profile.");
    }
  };

  const handleArchive = async (p) => {
    try {
      await familyProfilesApi.archiveProfile(p.id);
      toast?.info?.(`${p.name} archived.`);
      load();
    } catch (err) {
      toast?.error?.(err.message || "Could not archive this profile.");
    }
  };

  const handleRestore = async (p) => {
    try {
      await familyProfilesApi.restoreProfile(p.id);
      toast?.success?.(`${p.name} restored.`);
      load();
    } catch (err) {
      toast?.error?.(err.message || "Could not restore this profile.");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await familyProfilesApi.deleteProfile(confirmDelete.id);
      toast?.info?.(`${confirmDelete.name} deleted.`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast?.error?.(err.message || "Could not delete this profile.");
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
    if (search || relationshipFilter !== "all") return "No profiles match your search/filter.";
    return "Add your first family profile to start building your relationship hub.";
  }, [search, relationshipFilter]);

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
              ← Back to Dashboard
            </button>
            <h1 style={{ margin: 0, fontSize: "clamp(22px,4vw,30px)", background: GOLD_GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "Cinzel,serif", fontWeight: 700 }}>
              Family Profiles
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--nv-text-muted, rgba(200,160,255,0.65))" }}>
              Manage every birth chart in your circle, in one place.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleOpenRelationshipHubFromHeader}
              className="pill-btn tap-scale"
              style={{ padding: "12px 20px", borderRadius: 24, border: "1px solid rgba(180,120,255,0.4)", background: "rgba(123,47,255,0.18)", color: "var(--nv-text-primary, #e8d5ff)", fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "Cinzel,serif" }}
            >
              💞 Relationship Hub
            </button>
            <button
              onClick={handleAdd}
              className="submit-btn"
              style={{ padding: "13px 24px", borderRadius: 30, border: "1px solid rgba(180,120,255,0.45)", background: "var(--nv-accent-gradient, linear-gradient(135deg, #7b2fff, #4a00a0))", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "Cinzel,serif", boxShadow: "0 4px 20px rgba(123,47,255,0.35)" }}
            >
              + Add Profile
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
            <h2 style={{ margin: "0 0 12px", fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--nv-text-muted, rgba(200,160,255,0.55))" }}>🕑 Recently Opened</h2>
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
            placeholder="Search by name, relationship, or place…"
            aria-label="Search family profiles"
            style={{ flex: "1 1 220px", minWidth: 180, padding: "10px 16px", borderRadius: 20, fontSize: 13, border: "1px solid rgba(180,120,255,0.3)", background: "rgba(18,0,38,0.6)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
          />
          <select
            value={relationshipFilter}
            onChange={(e) => setRelationshipFilter(e.target.value)}
            aria-label="Filter by relationship"
            className="select-input"
            style={{ padding: "10px 14px", borderRadius: 20, fontSize: 12.5, cursor: "pointer", border: "1px solid rgba(180,120,255,0.3)", background: "rgba(18,0,38,0.6)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
          >
            <option value="all">All Relationships</option>
            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort family profiles"
            className="select-input"
            style={{ padding: "10px 14px", borderRadius: 20, fontSize: 12.5, cursor: "pointer", border: "1px solid rgba(180,120,255,0.3)", background: "rgba(18,0,38,0.6)", color: "var(--nv-text-primary, #e8d5ff)", fontFamily: "Inter,sans-serif" }}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--nv-text-muted, rgba(200,160,255,0.6))" }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show Archived
          </label>
        </section>

        {profiles === null && !error && <SkeletonList rows={4} variant="card" />}

        {profiles?.length === 0 && (
          <EmptyState icon="👨‍👩‍👧‍👦" title="No profiles yet" message={emptyMessage} actionLabel={search || relationshipFilter !== "all" ? undefined : "+ Add Profile"} onAction={search || relationshipFilter !== "all" ? undefined : handleAdd} />
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
        title="Delete this profile?"
        message={`"${confirmDelete?.name}" and any relationship comparisons involving them will no longer be accessible. This can't be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

export default FamilyProfilesPage;
