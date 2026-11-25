// Repairs: every repair order, newest first, with a status filter
import React, { useState } from "react";
import { Screen, Card, Muted, Choices } from "../ui";
import RepairCard from "./RepairCard";

const FILTERS = ["All", "Requested", "Scheduled", "In Progress", "Ready", "Completed"];

export default function Repairs({ data, go }) {
  const [filter, setFilter] = useState("All");
  const list = filter === "All" ? data.repairs : data.repairs.filter(r => r.status === filter);

  return (
    <Screen title="Repair Orders" subtitle="Every repair order, newest first.">
      <Choices value={filter} onChange={setFilter} options={FILTERS.map(f => ({ value: f, label: f }))} />
      {list.length === 0 ? <Card><Muted>No repairs here.</Muted></Card> : null}
      {list.map(r => <RepairCard key={r.id} repair={r} go={go} />)}
    </Screen>
  );
}
