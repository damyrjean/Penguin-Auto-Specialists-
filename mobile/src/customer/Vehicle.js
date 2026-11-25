// Vehicle Profile: your vehicles, and a form to add one
import React, { useState } from "react";
import { View, Alert } from "react-native";
import { api, vehicleName } from "../api";
import { Screen, Card, H2, Muted, Bold, Row, Tag, Button, Field, ErrorText } from "../ui";
import { primaryVehicle, miles } from "./helpers";

export default function Vehicle({ data, reload }) {
  const [vin, setVin] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [error, setError] = useState("");

  async function addVehicle() {
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      setError("A VIN must be 17 characters.");
      return;
    }
    if (year === "" || make.trim() === "" || model.trim() === "" || odometer === "") {
      setError("Please fill in the year, make, model, and odometer.");
      return;
    }

    try {
      await api("POST", "/my/vehicles", {
        vin: cleanVin,
        year: Number(year),
        make: make.trim(),
        model: model.trim(),
        plate: plate.trim() || "Not provided",
        odometer: Number(odometer)
      }, "customer");
      Alert.alert("Vehicle added");
      setVin(""); setYear(""); setMake(""); setModel(""); setPlate(""); setOdometer(""); setError("");
      await reload();
    } catch (e) {
      setError(e.message === "That already exists" ? "That VIN is already on file." : e.message);
    }
  }

  const primary = primaryVehicle(data);

  return (
    <Screen title="Vehicle Profile" subtitle="Your vehicles on file with the shop.">
      {data.vehicles.length === 0 ? <Card><Muted>No vehicles yet.</Muted></Card> : null}

      {data.vehicles.map(v => {
        const visits = data.repairs.filter(r => r.vehicle_id === v.id && r.status === "Completed").length;
        return (
          <Card key={v.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <H2>{vehicleName(v)}</H2>
              {v === primary ? <Tag text="Primary" color="blue" /> : null}
            </Row>
            <Muted>Current odometer</Muted>
            <Bold style={{ fontSize: 22, marginBottom: 8 }}>{miles(v.odometer)} mi</Bold>
            <Spec label="VIN" value={v.vin} />
            <Spec label="Plate" value={v.plate} />
            <Spec label="Visits" value={String(visits)} />
          </Card>
        );
      })}

      <Card>
        <H2>Add a Vehicle</H2>
        <Field label="VIN" value={vin} onChangeText={setVin} maxLength={17} autoCapitalize="characters" />
        <Row>
          <View style={{ flex: 1 }}><Field label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Make" value={make} onChangeText={setMake} /></View>
        </Row>
        <Row>
          <View style={{ flex: 1 }}><Field label="Model" value={model} onChangeText={setModel} /></View>
          <View style={{ flex: 1 }}><Field label="Plate" value={plate} onChangeText={setPlate} autoCapitalize="characters" /></View>
        </Row>
        <Field label="Odometer (mi)" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" />
        <ErrorText>{error}</ErrorText>
        <Button title="Add Vehicle" onPress={addVehicle} />
      </Card>
    </Screen>
  );
}

function Spec({ label, value }) {
  return (
    <Row style={{ justifyContent: "space-between", paddingVertical: 4 }}>
      <Muted>{label}</Muted>
      <Bold>{value}</Bold>
    </Row>
  );
}
