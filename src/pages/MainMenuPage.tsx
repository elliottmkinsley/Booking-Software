import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import EquipmentBrowser from "../components/EquipmentBrowser";
import { useAuth } from "../context/AuthContext";
import {
  addEquipment,
  getEquipmentCountForLab,
  getLabs,
  getSoftware,
} from "../services/labService";
import type { Equipment, Lab } from "../types";

interface LabWithCount extends Lab {
  equipmentCount: number;
}

export default function MainMenuPage() {
  const { user } = useAuth();
  const [labs, setLabs] = useState<LabWithCount[]>([]);
  const [software, setSoftware] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [labList, softwareList] = await Promise.all([
      getLabs(),
      getSoftware(),
    ]);
    const withCounts = await Promise.all(
      labList.map(async (lab) => ({
        ...lab,
        equipmentCount: await getEquipmentCountForLab(lab.id),
      }))
    );
    setLabs(withCounts);
    setSoftware(softwareList);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="page">
        <div className="page-intro">
          <h2>Labs</h2>
          <p className="muted">
            {user?.isAdmin
              ? "Select a lab to view its inventory or add new equipment."
              : "Select a lab to browse and book equipment."}
          </p>
        </div>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <>
            <div className="card-grid">
              {labs.map((lab) => (
                <Link key={lab.id} to={`/labs/${lab.id}`} className="lab-card">
                  <h3>{lab.name}</h3>
                  <p>{lab.description}</p>
                  <span className="lab-card-count">
                    {lab.equipmentCount}{" "}
                    {lab.equipmentCount === 1 ? "item" : "items"}
                  </span>
                </Link>
              ))}
            </div>

            <div className="page-intro page-section">
              <h2>Software</h2>
              <p className="muted">
                Software licenses shared across all Radiant Center labs.
              </p>
            </div>
            <EquipmentBrowser
              items={software}
              itemLabel="Software"
              emptyMessage="No software available yet."
              onAdd={async ({ name, description }) => {
                await addEquipment({
                  labId: null,
                  name,
                  description,
                  category: "software",
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
