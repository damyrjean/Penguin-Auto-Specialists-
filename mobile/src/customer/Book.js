// Book Appointment: pick a vehicle, services, date, and time
import React, { useState } from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { api, SHOP, money, iso, parse, vehicleName } from "../api";
import { Screen, Card, H2, Muted, Bold, Row, Button, Field, Choices, ErrorText, Icon, colors } from "../ui";
import { TIMES } from "./helpers";

// The next 10 days the shop is open (closed Sundays), starting tomorrow
function openDays() {
  const days = [];
  for (let i = 1; days.length < 10; i++) {
    const d = iso(i);
    if (parse(d).getDay() !== 0) days.push(d);
  }
  return days;
}

export default function Book({ data, reload, go }) {
  const vehicles = data.vehicles;
  const [vehicleId, setVehicleId] = useState(vehicles.length ? vehicles[0].id : null);
  const [picked, setPicked] = useState([]);   // service ids
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState(TIMES[0]);
  const [concern, setConcern] = useState("");
  const [error, setError] = useState("");

  if (vehicles.length === 0) {
    return (
      <Screen title="Book Appointment" subtitle="Request a time for your vehicle.">
        <Card>
          <Muted>Add a vehicle before booking.</Muted>
          <Button title="Add a Vehicle" onPress={() => go("vehicle")} style={{ marginTop: 12 }} />
        </Card>
      </Screen>
    );
  }

  function toggleService(id) {
    if (picked.includes(id)) setPicked(picked.filter(x => x !== id));
    else setPicked([...picked, id]);
  }

  let total = 0;
  for (const id of picked) {
    total += data.services.find(s => s.id === id).price;
  }

  async function submitBooking() {
    if (day === "") {
      setError("Please pick a date.");
      return;
    }
    if (picked.length === 0 && concern.trim() === "") {
      setError("Please choose a service or describe the problem.");
      return;
    }

    try {
      await api("POST", "/my/repairs", {
        vehicle_id: vehicleId,
        appt_date: day,
        appt_time: slot,
        concern: concern.trim(),
        service_ids: picked
      }, "customer");
      Alert.alert("Request sent", "The shop will confirm it soon.");
      await reload();
      go("dashboard");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Screen title="Book Appointment" subtitle="The shop will confirm your request and assign a technician.">
      <Card>
        <Choices
          label="Vehicle"
          value={vehicleId}
          onChange={setVehicleId}
          options={vehicles.map(v => ({ value: v.id, label: `${vehicleName(v)}, ${v.plate}` }))} />
      </Card>

      <Card>
        <H2>Select Services</H2>
        {data.services.map(s => {
          const on = picked.includes(s.id);
          return (
            <Pressable key={s.id} onPress={() => toggleService(s.id)} style={[styles.option, on && styles.optionOn]}>
              <Icon name={on ? "checkbox" : "square-outline"} size={22} color={on ? colors.blue : colors.muted} />
              <View style={{ flex: 1 }}>
                <Bold>{s.name}</Bold>
                <Muted style={{ fontSize: 12 }}>{s.checklist}</Muted>
              </View>
              <Text style={styles.price}>{money(s.price)}</Text>
            </Pressable>
          );
        })}
        <View style={{ height: 6 }} />
        <Field label="What is going on? (optional)" value={concern} onChangeText={setConcern} multiline numberOfLines={3} style={[styles.textArea]} />
      </Card>

      <Card>
        <H2>Select Date</H2>
        <Choices
          value={day}
          onChange={setDay}
          options={openDays().map(d => ({
            value: d,
            label: parse(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          }))} />
        <H2>Select Time</H2>
        <Choices value={slot} onChange={setSlot} options={TIMES.map(t => ({ value: t, label: t }))} />
      </Card>

      <Card>
        <Muted>Estimate before tax</Muted>
        <Bold style={{ fontSize: 22, marginBottom: 4 }}>{money(total)}</Bold>
        <Muted style={{ marginBottom: 12 }}>Shop hours: {SHOP.hours}</Muted>
        <ErrorText>{error}</ErrorText>
        <Button title={`Request Appointment • ${money(total)}`} onPress={submitBooking} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 8 },
  optionOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  price: { fontWeight: "700", color: colors.text },
  textArea: { minHeight: 80, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: "#fff", color: colors.text }
});
