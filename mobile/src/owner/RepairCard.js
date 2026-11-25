// One repair order in a list (used on Home and Repairs)
import React from "react";
import { View } from "react-native";
import { shortDate, time } from "../api";
import { Card, Muted, Bold, Row, Tag, StatusTag } from "../ui";

export const OPEN = ["Requested", "Scheduled", "In Progress", "Ready"];

export function techName(repair) {
  return repair.technician_name || "Unassigned";
}

export default function RepairCard({ repair, go, children }) {
  const r = repair;
  return (
    <Card onPress={() => go("repair", r.id)}>
      <Row style={{ justifyContent: "space-between" }}>
        <Bold style={{ color: "#1d4ed8" }}>#RO-{r.id}</Bold>
        <StatusTag status={r.status} />
      </Row>
      <Bold style={{ marginTop: 6 }}>{r.customer_name}</Bold>
      <Muted>{r.vehicle_name}</Muted>
      <Muted>{shortDate(r.appt_date)}, {time(r.appt_time)} • {techName(r)}</Muted>
      {r.waiting_approval ? <View style={{ marginTop: 6 }}><Tag text="Awaiting customer" color="amber" /></View> : null}
      {children}
    </Card>
  );
}
