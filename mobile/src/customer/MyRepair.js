// My Repair: status timeline, photo approvals, and the current estimate
import React from "react";
import { View, Text, Image, Alert, StyleSheet } from "react-native";
import { api, money, lineItems } from "../api";
import { Screen, Card, H2, Muted, Bold, Row, Tag, StatusTag, Button, LinkText, LineItem, Totals, Icon, colors } from "../ui";
import { STEPS, myOpenRepairs, techFor } from "./helpers";

export default function MyRepair({ data, reload, go, repairId }) {
  const openRepairs = myOpenRepairs(data);
  let repair = openRepairs.find(r => r.id === repairId);
  if (!repair) repair = openRepairs[0];

  if (!repair) {
    return (
      <Screen title="My Repair" subtitle="Live status of your repair.">
        <Card>
          <Muted>You have no open repairs.</Muted>
          <Button title="Book a Service" onPress={() => go("book")} style={{ marginTop: 12 }} />
        </Card>
      </Screen>
    );
  }

  async function decide(approvalId, choice) {
    try {
      await api("PATCH", "/my/approvals/" + approvalId, { status: choice }, "customer");
      if (choice === "approved") Alert.alert("Approved", "The shop will start the work.");
      else Alert.alert("Declined", "The shop will not do this work.");
      await reload();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  const others = openRepairs.filter(r => r.id !== repair.id);
  const current = STEPS.indexOf(repair.status);

  return (
    <Screen title={`Repair Order #${repair.id}`} subtitle={`${repair.vehicle_name}, ${repair.vehicle_plate}`}>
      {/* Links to the customer's other open repairs */}
      {others.length ? (
        <Row style={{ marginBottom: 12, flexWrap: "wrap" }}>
          <Muted>Other open orders:</Muted>
          {others.map(o => <LinkText key={o.id} onPress={() => go("repair", o.id)}>RO #{o.id}</LinkText>)}
        </Row>
      ) : null}

      {/* Status timeline */}
      <Card>
        <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <H2>Status</H2>
          <StatusTag status={repair.status} />
        </Row>
        {STEPS.map((step, i) => {
          const done = i <= current;
          return (
            <Row key={step} style={{ marginVertical: 5 }}>
              <View style={[styles.dot, done && styles.dotDone, i === current && styles.dotNow]}>
                {done ? <Icon name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <Text style={[styles.step, i === current && { fontWeight: "700", color: colors.text }]}>{step}</Text>
            </Row>
          );
        })}
      </Card>

      {/* Extra work the shop sent for approval */}
      <Card>
        <H2>Photos and Approvals</H2>
        <Muted style={{ marginBottom: 10 }}>No extra work starts until you approve it.</Muted>
        {repair.approvals.length === 0 ? <Muted>The shop has not sent any photos.</Muted> : null}
        {repair.approvals.map(a => (
          <View key={a.id} style={styles.approval}>
            {a.photo_url ? <Image source={{ uri: a.photo_url }} style={styles.photo} /> : null}
            <View style={{ padding: 12 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Bold style={{ flex: 1 }}>{a.title}</Bold>
                <Bold>{money(a.price)}</Bold>
              </Row>
              {a.note ? <Muted style={{ marginVertical: 6 }}>{a.note}</Muted> : null}
              {a.status === "pending" ? (
                <Row style={{ marginTop: 6 }}>
                  <Button title="Approve" small onPress={() => decide(a.id, "approved")} style={{ flex: 1 }} />
                  <Button title="Decline" small ghost onPress={() => decide(a.id, "declined")} style={{ flex: 1 }} />
                </Row>
              ) : a.status === "approved" ? <Tag text="Approved" color="green" /> : <Tag text="Declined" color="red" />}
            </View>
          </View>
        ))}
      </Card>

      {/* Estimate */}
      <Card>
        <H2>Current Estimate</H2>
        <Muted>Technician: {techFor(repair)}</Muted>
        {lineItems(repair).map((item, i) => <LineItem key={i} label={item.label} amount={item.amount} />)}
        <Totals repair={repair} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  dotDone: { backgroundColor: colors.green, borderColor: colors.green },
  dotNow: { backgroundColor: colors.blue, borderColor: colors.blue },
  step: { color: colors.muted, fontSize: 15 },
  approval: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: "hidden", marginBottom: 10 },
  photo: { width: "100%", height: 180, backgroundColor: colors.bg }
});
