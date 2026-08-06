import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import ConsumablesPanel from "../components/ConsumablesPanel";
import EquipmentBrowser from "../components/EquipmentBrowser";
import ImportEquipmentModal from "../components/ImportEquipmentModal";
import { useAuth } from "../context/AuthContext";
import { canAddEquipmentToLab } from "../services/permissionsService";
import {
  addEquipment,
  getEquipmentForLab,
  getLab,
} from "../services/labService";
import type { Equipment, Lab } from "../types";

export default function LabDetailPage() {
  const { labId } = useParams<{ labId: string }>();
  const { user } = useAuth();

  const [lab, setLab] = useState<Lab | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!labId) return;
    const [labResult, equipmentResult, allowed] = await Promise.all([
      getLab(labId),
      getEquipmentForLab(labId),
      canAddEquipmentToLab(user, labId),
    ]);
    setLab(labResult ?? null);
    setEquipment(equipmentResult);
    setCanManage(allowed);
    setLoading(false);
  }, [labId, user]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">
        <Link to="/labs" className="back-link">
          &larr; Main menu
        </Link>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : !lab ? (
          <p className="muted">Lab not found.</p>
        ) : (
          <>
            <div className="page-intro">
              <h2>{lab.name}</h2>
              <p className="muted">{lab.description}</p>
            </div>
            <EquipmentBrowser
              items={equipment}
              itemLabel="Equipment"
              emptyMessage="No equipment in this lab yet."
              canAdd={canManage}
              toolbarActions={
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowImport(true)}
                >
                  Import Excel
                </button>
              }
              onAdd={async (input) => {
                if (!user) return;
                await addEquipment(
                  {
                    labId: lab.id,
                    name: input.name,
                    description: input.description,
                    category: "equipment",
                    trainingIds: input.trainingIds,
                    rentalGranularity: input.rentalGranularity,
                    imageUrl: input.imageUrl,
                  },
                  user
                );
              }}
              onChanged={refresh}
            />
            <ConsumablesPanel
              labId={lab.id}
              canManage={canManage}
              title="Lab consumables"
            />
            {showImport && (
              <ImportEquipmentModal
                lab={lab}
                onClose={() => setShowImport(false)}
                onImported={refresh}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
