import type { Person } from "../types";

interface PersonCardProps {
  person: Person;
  roleLabel: string;
}

export default function PersonCard({ person, roleLabel }: PersonCardProps) {
  return (
    <div className="person-card">
      <span className="person-role">{roleLabel}</span>
      <strong className="person-name">{person.name}</strong>
      <span className="muted person-title">{person.title}</span>
      <a className="btn btn-outline btn-small" href={`mailto:${person.email}`}>
        Email
      </a>
    </div>
  );
}
