// One repair order: status, technician, services and parts, photo approvals, invoice
import React, { useEffect, useState } from "react";
import { View, Image, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { money, date, time, iso, lineItems } from "../api";
import { Screen, Card, H2, Muted, Bold, Row, Tag, StatusTag, Button, Field, Choices, ErrorText,
         LineItem, Totals, InvoiceModal, Message, colors } from "../ui";
import { ownerApi } from "./ownerApi";
import { OPEN, techName } from "./RepairCard";

export default function RepairDetail({ data, reload, go, id }) {
  const [r, setR] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [serviceId, setServiceId] = useState(null);
  const [partId, setPartId] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Approval form
  const [work, setWork] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [approvalError, setApprovalError] = useState("");

  async function loadRepair() {
    try {
      setR(await ownerApi("GET", "/repairs/" + id));
    } catch (e) {
      setNotFound(true);
    }
  }

  useEffect(() => {
    loadRepair();
  }, [id]);

  // Runs an API call, shows any error, then reloads this repair and the lists
  async function save(apiCall, message) {
    try {
      await apiCall;
      if (message) Alert.alert(message);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    await loadRepair();
    reload();
  }

  if (notFound) {
    return (
      <Screen title="Repair not found" onBack={() => go("repairs")}>
        <Card><Muted>That repair order could not be loaded.</Muted></Card>
      </Screen>
    );
  }
  if (!r) return <Message text="Loading..." />;

  const invoice = data.transactions.find(t => t.repair_id === r.id);
  const finished = r.status === "Completed" || r.status === "Cancelled";
  const pending = r.approvals.some(a => a.status === "pending");

  // ---------- Status and technician ----------
  function changeStatus(status) {
    save(ownerApi("PATCH", "/repairs/" + r.id, { status: status }));
  }

  function changeTech(techId) {
    save(ownerApi("PATCH", "/repairs/" + r.id, { technician_id: techId }));
  }

  const techOptions = [{ value: null, label: "Unassigned" }];
  for (const e of data.employees) {
    if (e.role === "Service Advisor" || !e.active) continue;
    techOptions.push({ value: e.id, label: e.name });
  }

  // ---------- Services and parts ----------
  function addService() {
    if (!serviceId) return Alert.alert("Pick a service first.");
    save(ownerApi("POST", "/repairs/" + r.id + "/services", { service_id: serviceId }));
    setServiceId(null);
  }

  function addPart() {
    if (!partId) return Alert.alert("Pick a part first.");
    save(ownerApi("POST", "/repairs/" + r.id + "/parts", { part_id: partId, qty: 1 }));
    setPartId(null);
  }

  // ---------- Photo approvals ----------
  // Take or pick a photo. The photo is turned into text so it can be saved in the database.
  async function getPhoto(useCamera) {
    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert("Camera permission is needed to take a photo.");
      result = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: true });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.4, base64: true });
    }
    if (result.canceled) return;

    const asset = result.assets[0];
    // base64 text is about 4/3 the size of the photo, so this keeps it under 1 MB
    if (asset.base64.length > 1333333) {
      setApprovalError("Please use a photo under 1 MB.");
      return;
    }
    setApprovalError("");
    setPhoto("data:" + (asset.mimeType || "image/jpeg") + ";base64," + asset.base64);
  }

  async function sendApproval() {
    const amount = Number(price);
    if (work.trim() === "" || !(amount > 0)) {
      setApprovalError("Please enter the work needed and a price.");
      return;
    }
    if (!photo) {
      setApprovalError("Please add a photo so the customer can see the problem.");
      return;
    }
    await save(ownerApi("POST", "/repairs/" + r.id + "/approvals", {
      title: work.trim(),
      note: note.trim(),
      price: amount,
      photo_url: photo
    }), "Sent to the customer for approval.");
    setWork(""); setPrice(""); setNote(""); setPhoto(null); setApprovalError("");
  }

  // ---------- Invoice ----------
  function createInvoice() {
    save(ownerApi("POST", "/transactions", { repair_id: r.id, amount: r.total, status: "Unpaid" }));
  }

  async function markPaid() {
    try {
      await ownerApi("PATCH", "/transactions/" + invoice.id, { status: "Paid", date: iso(0) });
      await ownerApi("PATCH", "/repairs/" + r.id, { status: "Completed" });
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    await loadRepair();
    reload();
  }

  let invoiceButtons = null;
  if (!invoice) {
    if (pending) invoiceButtons = <Muted>Waiting on customer approval before invoicing.</Muted>;
    else if (!finished) invoiceButtons = <Button title="Generate Invoice" onPress={createInvoice} />;
  } else {
    invoiceButtons = (
      <Row>
        <Button title="View Invoice" ghost small onPress={() => setShowInvoice(true)} />
        {invoice.status !== "Paid"
          ? <Button title="Mark as Paid" small onPress={markPaid} />
          : <Tag text="Paid" color="green" />}
      </Row>
    );
  }

  return (
    <Screen title={`Repair Order #${r.id}`} subtitle={`${r.customer_name}, ${r.customer_phone}\n${r.vehicle_name}, ${r.vehicle_plate}`} onBack={() => go("repairs")}>
      <Card>
        <H2>Work Order</H2>
        {r.concern ? <Muted style={{ marginBottom: 4 }}><Bold>Customer concern:</Bold> {r.concern}</Muted> : null}
        <Muted style={{ marginBottom: 12 }}><Bold>Appointment:</Bold> {date(r.appt_date)}, {time(r.appt_time)}</Muted>
        {finished ? (
          <View>
            <Row style={{ marginBottom: 6 }}><Muted>Status:</Muted><StatusTag status={r.status} /></Row>
            <Muted>Technician: {techName(r)}</Muted>
          </View>
        ) : (
          <View>
            <Choices label="Status" value={r.status} onChange={changeStatus}
              options={[...OPEN, "Cancelled"].map(s => ({ value: s, label: s }))} />
            <Choices label="Technician" value={r.technician_id} onChange={changeTech} options={techOptions} />
          </View>
        )}
      </Card>

      <Card>
        <H2>Services and Parts</H2>
        {lineItems(r).length === 0 ? <Muted>No items yet.</Muted> : null}
        {lineItems(r).map((item, i) => (
          <LineItem key={i} label={item.label + (item.qty > 1 ? " x " + item.qty : "")} amount={item.amount} />
        ))}
        {!finished ? (
          <View style={{ marginTop: 14 }}>
            <Choices label="Add service" value={serviceId} onChange={setServiceId}
              options={data.services.map(s => ({ value: s.id, label: s.name }))} />
            <Button title="Add Service" ghost small onPress={addService} style={{ marginBottom: 14 }} />
            <Choices label="Add part" value={partId} onChange={setPartId}
              options={data.parts.map(p => ({ value: p.id, label: `${p.name} (${p.stock} left)` }))} />
            <Button title="Add Part" ghost small onPress={addPart} />
          </View>
        ) : null}
      </Card>

      <Card>
        <H2>Customer Approvals</H2>
        {r.approvals.length === 0 ? <Muted>No photos sent yet.</Muted> : null}
        {r.approvals.map(a => (
          <View key={a.id} style={styles.approval}>
            {a.photo_url ? <Image source={{ uri: a.photo_url }} style={styles.photo} /> : null}
            <View style={{ padding: 12 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Bold style={{ flex: 1 }}>{a.title}</Bold>
                <Bold>{money(a.price)}</Bold>
              </Row>
              {a.note ? <Muted style={{ marginVertical: 6 }}>{a.note}</Muted> : null}
              {a.status === "approved" ? <Tag text="Approved" color="green" />
                : a.status === "declined" ? <Tag text="Declined" color="red" />
                : <Tag text="Waiting on customer" color="amber" />}
            </View>
          </View>
        ))}

        {!finished ? (
          <View style={{ marginTop: 8 }}>
            <Field label="Work needed" value={work} onChangeText={setWork} />
            <Field label="Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            <Field label="Note to customer" value={note} onChangeText={setNote} />
            {photo ? <Image source={{ uri: photo }} style={[styles.photo, { borderRadius: 10, marginBottom: 10 }]} /> : null}
            <Row style={{ marginBottom: 12 }}>
              <Button title="Take Photo" ghost small onPress={() => getPhoto(true)} style={{ flex: 1 }} />
              <Button title="Choose Photo" ghost small onPress={() => getPhoto(false)} style={{ flex: 1 }} />
            </Row>
            <ErrorText>{approvalError}</ErrorText>
            <Button title="Send to Customer" onPress={sendApproval} />
          </View>
        ) : null}
      </Card>

      <Card>
        <H2>Invoice</H2>
        <Totals repair={r} />
        <View style={{ marginTop: 14 }}>{invoiceButtons}</View>
      </Card>

      {showInvoice ? <InvoiceModal repair={r} onClose={() => setShowInvoice(false)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  approval: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: "hidden", marginBottom: 10 },
  photo: { width: "100%", height: 180, backgroundColor: colors.bg }
});
