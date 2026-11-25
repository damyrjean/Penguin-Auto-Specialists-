// Owner Home: counts, new appointment requests, open repairs
import React from "react";
import { Alert } from "react-native";
import { Screen, Card, H2, Muted, Bold, Row, Button } from "../ui";
import { ownerApi } from "./ownerApi";
import RepairCard, { OPEN } from "./RepairCard";

export default function Overview({ data, reload, go }) {
  const open = data.repairs.filter(r => OPEN.includes(r.status));
  open.sort((a, b) => a.appt_date.localeCompare(b.appt_date));
  const requests = open.filter(r => r.status === "Requested");
  const lowStock = data.parts.filter(p => p.stock <= p.reorder);

  async function acceptRequest(id) {
    try {
      await ownerApi("PATCH", "/repairs/" + id, { status: "Scheduled" });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    reload();
  }

  return (
    <Screen title="Shop Dashboard" subtitle="Everything happening in the shop.">
      <Row style={{ marginBottom: 12 }}>
        <Stat label="Open repairs" value={open.length} onPress={() => go("repairs")} />
        <Stat label="New requests" value={requests.length} onPress={() => go("repairs")} />
        <Stat label="Low stock" value={lowStock.length} onPress={() => go("parts")} />
      </Row>

      <H2>New Appointment Requests</H2>
      {requests.length === 0 ? <Card><Muted>No new requests.</Muted></Card> : null}
      {requests.map(r => (
        <RepairCard key={r.id} repair={r} go={go}>
          <Button title="Accept" small onPress={() => acceptRequest(r.id)} style={{ marginTop: 10 }} />
        </RepairCard>
      ))}

      <H2>Open Repairs</H2>
      {open.length === 0 ? <Card><Muted>No open repairs.</Muted></Card> : null}
      {open.map(r => <RepairCard key={r.id} repair={r} go={go} />)}
    </Screen>
  );
}

function Stat({ label, value, onPress }) {
  return (
    <Card style={{ flex: 1, marginBottom: 0, padding: 12 }} onPress={onPress}>
      <Muted style={{ fontSize: 12 }}>{label}</Muted>
      <Bold style={{ fontSize: 24 }}>{value}</Bold>
    </Card>
  );
}
