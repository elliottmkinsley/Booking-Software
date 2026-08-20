/**
 * Home screen after sign-in: lab cards plus the shared software list.
 *
 * Admins and assigned lab managers can enter "Edit Labs" to rename, restyle,
 * or remove labs. Standard users just pick a lab to browse its equipment.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import CardEditControls from "../components/CardEditControls";
import EditLabInfoModal from "../components/EditLabInfoModal";
import EquipmentBrowser from "../components/EquipmentBrowser";
import { useAuth } from "../context/AuthContext";
import {
  canAddLab,
  canAddSoftware,
  canManageLabs,
  getVisibleLabsForUser,
  isAdmin,
  isDevUser,
  isLabOwnerSession,
} from "../../business/permissions";
import {
  addEquipment,
  getEquipmentCountForLab,
  getLabs,
  getSoftware,
  removeLab,
} from "../../business/labs";
import type { Equipment, Lab } from "../../shared/types";
import { labImage } from "../../shared/utils/images";

interface LabWithCount extends Lab {
  equipmentCount: number;
}

export default function MainMenuPage() {
  const { user } = useAuth();
  const [labs, setLabs] = useState<LabWithCount[]>([]);
  const [software, setSoftware] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLabs, setEditingLabs] = useState(false);
  const [labFormTarget, setLabFormTarget] = useState<Lab | null | undefined>(
    undefined
  );

  const refresh = useCallback(async () => {
    const [labList, softwareList] = await Promise.all([
      getLabs(),
      getSoftware(),
    ]);
    const visibleLabs = await getVisibleLabsForUser(user, labList);
    const withCounts = await Promise.all(
      visibleLabs.map(async (lab) => ({
        ...lab,
        equipmentCount: await getEquipmentCountForLab(lab.id),
      }))
    );
    setLabs(withCounts);
    setSoftware(softwareList);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  async function handleRemoveLab(lab: LabWithCount) {
    if (!user) return;
    const confirmed = window.confirm(
      lab.equipmentCount > 0
        ? `Remove "${lab.name}" and its ${lab.equipmentCount} equipment item${lab.equipmentCount === 1 ? "" : "s"}? This cannot be undone.`
        : `Remove "${lab.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    await removeLab(lab.id, user);
    await refresh();
  }

  const introText = isAdmin(user)
    ? "Create labs, assign managers, and manage equipment across the center."
    : isDevUser(user)
      ? "Dev access: every lab is visible so you can explore the full inventory."
      : isLabOwnerSession(user)
        ? "Your assigned labs are listed below. You can add equipment to those labs."
        : "Select a lab to browse and reserve equipment.";

  const showLabForm = labFormTarget !== undefined;

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">
        <div className="page-intro">
          <h2>Labs</h2>
          <p className="muted">{introText}</p>
        </div>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <>
            {canManageLabs(user) && (
              <div className="admin-toolbar admin-toolbar-row">
                <button
                  type="button"
                  className={editingLabs ? "btn btn-outline" : "btn btn-primary"}
                  onClick={() => setEditingLabs((value) => !value)}
                >
                  {editingLabs ? "Done" : "Edit Labs"}
                </button>
                {editingLabs && canAddLab(user) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setLabFormTarget(null)}
                  >
                    + Add Lab
                  </button>
                )}
              </div>
            )}

            {editingLabs && (
              <p className="muted edit-labs-hint">
                Use the red × to remove a lab, or ⋯ to edit its name and
                description.
              </p>
            )}

            {labs.length === 0 ? (
              <p className="muted">
                {isLabOwnerSession(user) && !isDevUser(user)
                  ? "You have no labs assigned yet. Ask an admin to assign labs to your account."
                  : "No labs available yet."}
              </p>
            ) : (
              <div className="card-grid">
                {labs.map((lab) => {
                  const cardBody = (
                    <>
                      <div className="media-card-image-wrap">
                        <img
                          className="media-card-image"
                          src={labImage(lab)}
                          alt={lab.name}
                        />
                        {editingLabs && (
                          <CardEditControls
                            itemName={lab.name}
                            onRemove={() => handleRemoveLab(lab)}
                            onEdit={() => setLabFormTarget(lab)}
                          />
                        )}
                      </div>
                      <div className="media-card-body">
                        <h3>{lab.name}</h3>
                        <p>{lab.description}</p>
                        <span className="media-card-meta">
                          {lab.equipmentCount}{" "}
                          {lab.equipmentCount === 1 ? "item" : "items"}
                        </span>
                      </div>
                    </>
                  );

                  if (editingLabs) {
                    return (
                      <div
                        key={lab.id}
                        className="media-card media-card-editing"
                      >
                        {cardBody}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={lab.id}
                      to={`/labs/${lab.id}`}
                      className="media-card"
                    >
                      {cardBody}
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="page-intro page-section">
              <h2>Software</h2>
              <p className="muted">
                Shared software licenses — see each page for download and
                contact info (no reservation required).
              </p>
            </div>
            <EquipmentBrowser
              items={software}
              itemLabel="Software"
              emptyMessage="No software available yet."
              canAdd={canAddSoftware(user)}
              onAdd={async (input) => {
                if (!user) return;
                await addEquipment(
                  {
                    labId: null,
                    name: input.name,
                    description: input.description,
                    category: "software",
                    imageUrl: input.imageUrl,
                    downloadUrl: input.downloadUrl,
                    accessInstructions: input.accessInstructions,
                    contactName: input.contactName,
                    contactEmail: input.contactEmail,
                  },
                  user
                );
              }}
              onChanged={refresh}
            />
          </>
        )}
      </main>

      {showLabForm && (
        <EditLabInfoModal
          lab={labFormTarget}
          onClose={() => setLabFormTarget(undefined)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
