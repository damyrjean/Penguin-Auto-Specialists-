// Service History: past visits and invoices
import React, { useState } from "react";
import { View } from "react-native";
import { money, shortDate } from "../api";
import { Screen, Card, H2, Muted, Bold, Row, Tag, Button, InvoiceModal } from "../ui";
import { serviceNames } from "./helpers";

export default function History({ data }) {
  const [invoice, setInvoice] = useState(null);

  const done = data.repairs.filter(r => r.status === "Completed");
  done.sort((a, b) => b.appt_date.localeCompare(a.appt_date));

  let spent = 0;
  done.forEach(r => spent += r.total);

  return (
    <Screen title="Service History" subtitle="Past visits and invoices.">
      <Row style={{ marginBottom: 12 }}>
        <Card style={{ flex: 1, marginBottom: 0 }}>
          <Muted>Visits</Muted>
          <Bold style={{ fontSize: 22 }}>{done.length}</Bold>
        </Card>
        <Card style={{ flex: 1, marginBottom: 0 }}>
          <Muted>Total spent</Muted>
          <Bold style={{ fontSize: 22 }}>{money(spent)}</Bold>
        </Card>
      </Row>

      {done.length === 0 ? <Card><Muted>No completed visits yet.</Muted></Card> : null}

      {done.map(r => (
        <Card key={r.id}>
          <Row style={{ justifyContent: "space-between" }}>
            <Muted>{shortDate(r.appt_date)} • RO #{r.id}</Muted>
            <Tag text="Completed" color="green" />
          </Row>
          <H2>{serviceNames(r)}</H2>
          <Muted>{r.vehicle_name}</Muted>
          <Row style={{ justifyContent: "space-between", marginTop: 10 }}>
            <Button title="View Invoice" small ghost onPress={() => setInvoice(r)} />
            <Bold style={{ fontSize: 16 }}>{money(r.total)}</Bold>
          </Row>
        </Card>
      ))}

      <InvoiceModal repair={invoice} onClose={() => setInvoice(null)} />
      <View />
    </Screen>
  );
}
