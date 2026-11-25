// Customer Dashboard: approval alert, active vehicle, next service, quick actions, upcoming service
import React from "react";
import { View, Text, Pressable, Linking, StyleSheet } from "react-native";
import { SHOP, money, date, time, relative, vehicleName } from "../api";
import { Screen, Card, H2, Muted, Bold, Row, Tag, Button, Divider, Icon, colors } from "../ui";
import { primaryVehicle, myOpenRepairs, techFor, serviceNames, checksFor, miles } from "./helpers";

export default function Dashboard({ data, go, onExit }) {
  const vehicle = primaryVehicle(data);
  const openRepairs = myOpenRepairs(data);
  const waiting = openRepairs.find(r => r.approvals.some(a => a.status === "pending"));
  const upcoming = openRepairs.find(r => r.status === "Requested" || r.status === "Scheduled");

  // ---------- Vehicle card and next service reminder ----------
  let vehicleCard = (
    <Card>
      <Muted>You have no vehicles yet.</Muted>
      <Button title="Add a Vehicle" onPress={() => go("vehicle")} style={{ marginTop: 12 }} />
    </Card>
  );
  if (vehicle) {
    const odometer = vehicle.odometer || 0;
    const nextService = (Math.floor(odometer / 5000) + 1) * 5000;
    const milesLeft = nextService - odometer;
    vehicleCard = (
      <View>
        <Card>
          <Row style={{ justifyContent: "space-between" }}>
            <View>
              <H2>Active Vehicle</H2>
              <Muted>Primary vehicle on your account</Muted>
            </View>
            <Tag text="Primary" color="blue" />
          </Row>
          <Row style={{ marginTop: 12 }}>
            <View style={styles.carIcon}><Icon name="car-sport" size={26} color={colors.blue} /></View>
            <View>
              <Bold style={{ fontSize: 16 }}>{vehicleName(vehicle)}</Bold>
              <Muted>Odometer: {miles(odometer)} mi</Muted>
              <Muted>Plate: {vehicle.plate}</Muted>
            </View>
          </Row>
        </Card>
        <Card style={styles.blueAlert}>
          <Bold>Next service due</Bold>
          <Muted>{nextService.toLocaleString()} mile service, due in {milesLeft.toLocaleString()} mi.</Muted>
        </Card>
      </View>
    );
  }

  // ---------- Upcoming appointment card ----------
  let upcomingCard = (
    <Card>
      <Text style={styles.eyebrow}>UPCOMING SERVICE</Text>
      <Muted style={{ marginVertical: 10 }}>Nothing booked right now.</Muted>
      <Button title="Book a Service" onPress={() => go("book")} />
    </Card>
  );
  if (upcoming) {
    const checks = [];
    for (const s of upcoming.services) {
      const service = data.services.find(x => x.id === s.id);
      if (service) checks.push(...checksFor(service));
    }
    upcomingCard = (
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Text style={styles.eyebrow}>UPCOMING SERVICE</Text>
          <Tag text={relative(upcoming.appt_date)} color="blue" />
        </Row>
        <H2>{serviceNames(upcoming)}</H2>
        <Muted>{date(upcoming.appt_date)}, {time(upcoming.appt_time)}</Muted>
        <Muted>{upcoming.vehicle_name}</Muted>
        <Muted>Technician: {techFor(upcoming)}</Muted>
        {checks.length ? (
          <View>
            <Divider />
            <Bold>Included Checks:</Bold>
            {checks.map((c, i) => <Muted key={i}>• {c}</Muted>)}
          </View>
        ) : null}
        <Divider />
        <Row style={{ justifyContent: "space-between" }}>
          <View>
            <Muted>Estimate before tax</Muted>
            <Bold style={{ fontSize: 20 }}>{money(upcoming.subtotal)}</Bold>
          </View>
          <Button title="View Details" small onPress={() => go("repair", upcoming.id)} />
        </Row>
      </Card>
    );
  }

  const phone = SHOP.phone.replace(/\D/g, "");
  const mapLink = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(SHOP.address);

  return (
    <Screen title="Dashboard" subtitle={`Welcome back, ${data.me.first_name}!`}>
      {/* Yellow box if the shop is waiting on the customer to approve work */}
      {waiting ? (
        <Card style={styles.amberAlert} onPress={() => go("repair", waiting.id)}>
          <Bold>Your approval is needed</Bold>
          <Muted>RO #{waiting.id}: the shop found extra work on your {waiting.vehicle_name}. Tap to review it.</Muted>
        </Card>
      ) : null}

      {vehicleCard}

      <H2>Quick Actions</H2>
      <Row style={{ marginBottom: 12 }}>
        <QuickAction icon="construct" label="Book Service" onPress={() => go("book")} />
        <QuickAction icon="call" label="Call Shop" onPress={() => Linking.openURL("tel:" + phone)} />
        <QuickAction icon="navigate" label="Directions" onPress={() => Linking.openURL(mapLink)} />
      </Row>

      {upcomingCard}

      <Button title="Log Out" ghost onPress={onExit} />
    </Screen>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <Pressable style={styles.action} onPress={onPress}>
      <Icon name={icon} size={22} color={colors.blue} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carIcon: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center" },
  blueAlert: { backgroundColor: colors.blueSoft, borderColor: "#c7d7fb" },
  amberAlert: { backgroundColor: "#fef3c7", borderColor: "#fcd34d" },
  eyebrow: { fontSize: 12, fontWeight: "700", color: colors.blue, letterSpacing: 0.5 },
  action: { flex: 1, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, alignItems: "center", gap: 6 },
  actionText: { fontSize: 12, fontWeight: "600", color: colors.text }
});
