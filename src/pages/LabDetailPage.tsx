import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import EquipmentBrowser from "../components/EquipmentBrowser";
import {
  addEquipment,
  getEquipmentForLab,
  getLab,
} from "../services/labService";
import type { Equipment, Lab } from "../types";

export default function LabDetailPage() {
  const { labId } = useParams<{ labId: string }>();

  const [lab, setLab] = useState<Lab | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!labId) return;
    const [labResult, equipmentResult] = await Promise.all([
      getLab(labId),
      getEquipmentForLab(labId),
    ]);
    setLab(labResult ?? null);
    setEquipment(equipmentResult);
    setLoading(false);
  }, [labId]);

  useEffect(() => {
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
              onAdd={async ({ name, description }) => {
                await addEquipment({
                  labId: lab.id,
                  name,
                  description,
                  category: "equipment",
                });
              }}
              onChanged={refresh}
            />
          </>
        )}
      </main>
    </div>
  );
}
