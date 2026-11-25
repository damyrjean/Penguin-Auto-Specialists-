// Customers: everyone with an account
import React from "react";
import { Linking } from "react-native";
import { customerName } from "../api";
import { Screen, Card, Muted, Bold, Row, LinkText } from "../ui";

export default function Customers({ data }) {
  return (
    <Screen title="Customers" subtitle="Everyone with an account.">
      {data.customers.length === 0 ? <Card><Muted>No customers yet.</Muted></Card> : null}
      {data.customers.map(c => {
        const vehicleCount = data.vehicles.filter(v => v.customer_id === c.id).length;
        return (
          <Card key={c.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <Bold>{customerName(c)}</Bold>
              <Muted>#{c.id}</Muted>
            </Row>
            {c.phone ? <LinkText onPress={() => Linking.openURL("tel:" + c.phone.replace(/\D/g, ""))}>{c.phone}</LinkText> : null}
            <Muted>{c.email}</Muted>
            <Muted>{vehicleCount} vehicle{vehicleCount === 1 ? "" : "s"}</Muted>
          </Card>
        );
      })}
    </Screen>
  );
}
