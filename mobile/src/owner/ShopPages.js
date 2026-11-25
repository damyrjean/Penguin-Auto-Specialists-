// Owner sections under More: Vehicles, Employees, Parts, Services, Transactions, Settings
import React, { useState } from "react";
import { View, Alert } from "react-native";
import { SHOP, money, shortDate, vehicleName, customerName } from "../api";
import { Screen, Card, H2, Muted, Bold, Row, Tag, Button, Field, Choices, ErrorText, InvoiceModal } from "../ui";
import { ownerApi } from "./ownerApi";
import { OPEN } from "./RepairCard";

// Runs an API call, shows any error, then reloads the lists
async function save(apiCall, reload, message) {
  try {
    await apiCall;
    if (message) Alert.alert(message);
    await reload();
    return true;
  } catch (e) {
    Alert.alert("Error", e.message);
    return false;
  }
}


// ---------- Vehicles ----------

export function Vehicles({ data, go }) {
  return (
    <Screen title="Vehicles" subtitle="All vehicles on file." onBack={() => go("more")}>
      {data.vehicles.length === 0 ? <Card><Muted>No vehicles yet.</Muted></Card> : null}
      {data.vehicles.map(v => {
        const owner = data.customers.find(c => c.id === v.customer_id);
        return (
          <Card key={v.id}>
            <Bold>{vehicleName(v)}</Bold>
            <Muted>Owner: {customerName(owner)}</Muted>
            <Muted>VIN: {v.vin}</Muted>
            <Muted>Plate: {v.plate} • {(v.odometer || 0).toLocaleString()} mi</Muted>
          </Card>
        );
      })}
    </Screen>
  );
}


// ---------- Employees ----------

export function Employees({ data, reload, go }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Technician");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  async function addEmployee() {
    if (name.trim() === "") {
      setError("Please enter a name.");
      return;
    }
    const ok = await save(ownerApi("POST", "/employees", { name: name.trim(), role: role, phone: phone.trim() }), reload);
    if (ok) { setName(""); setPhone(""); setError(""); }
  }

  return (
    <Screen title="Employees" subtitle="Staff and how many open jobs each has." onBack={() => go("more")}>
      {data.employees.map(e => {
        const jobs = data.repairs.filter(r => r.technician_id === e.id && OPEN.includes(r.status)).length;
        return (
          <Card key={e.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <Bold>{e.name}</Bold>
              <Tag text={`${jobs} open job${jobs === 1 ? "" : "s"}`} color={jobs ? "blue" : "gray"} />
            </Row>
            <Muted>{e.role}</Muted>
            <Muted>{e.phone}</Muted>
          </Card>
        );
      })}
      <Card>
        <H2>Add Employee</H2>
        <Field label="Name" value={name} onChangeText={setName} />
        <Choices label="Role" value={role} onChange={setRole}
          options={["Technician", "Master Technician", "Service Advisor"].map(r => ({ value: r, label: r }))} />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <ErrorText>{error}</ErrorText>
        <Button title="Add" onPress={addEmployee} />
      </Card>
    </Screen>
  );
}


// ---------- Parts ----------

export function Parts({ data, reload, go }) {
  const [form, setForm] = useState({ name: "", sku: "", stock: "", reorder: "", cost: "", price: "" });
  const [error, setError] = useState("");
  const set = (key, value) => setForm({ ...form, [key]: value });

  function orderPart(part) {
    save(ownerApi("PATCH", "/parts/" + part.id, { stock: part.stock + 5 }), reload, "Ordered 5 more " + part.name + ".");
  }

  async function addNewPart() {
    if (Object.values(form).some(v => v.trim() === "")) {
      setError("Please fill in every field.");
      return;
    }
    const ok = await save(ownerApi("POST", "/parts", {
      name: form.name.trim(),
      sku: form.sku.trim(),
      stock: Number(form.stock),
      reorder: Number(form.reorder),
      cost: Number(form.cost),
      price: Number(form.price)
    }), reload);
    if (ok) { setForm({ name: "", sku: "", stock: "", reorder: "", cost: "", price: "" }); setError(""); }
  }

  return (
    <Screen title="Parts" subtitle="Inventory. Parts at or below their reorder level are marked Low." onBack={() => go("more")}>
      {data.parts.map(p => (
        <Card key={p.id}>
          <Row style={{ justifyContent: "space-between" }}>
            <Bold style={{ flex: 1 }}>{p.name}</Bold>
            {p.stock <= p.reorder ? <Tag text="Low" color="amber" /> : null}
          </Row>
          <Muted>SKU {p.sku} • {money(p.price)}</Muted>
          <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
            <Muted>In stock: <Bold>{p.stock}</Bold></Muted>
            <Button title="Order 5" ghost small onPress={() => orderPart(p)} />
          </Row>
        </Card>
      ))}
      <Card>
        <H2>Add Part</H2>
        <Field label="Name" value={form.name} onChangeText={v => set("name", v)} />
        <Field label="SKU" value={form.sku} onChangeText={v => set("sku", v)} autoCapitalize="characters" />
        <Row>
          <View style={{ flex: 1 }}><Field label="Stock" value={form.stock} onChangeText={v => set("stock", v)} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Reorder at" value={form.reorder} onChangeText={v => set("reorder", v)} keyboardType="number-pad" /></View>
        </Row>
        <Row>
          <View style={{ flex: 1 }}><Field label="Cost" value={form.cost} onChangeText={v => set("cost", v)} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Price" value={form.price} onChangeText={v => set("price", v)} keyboardType="decimal-pad" /></View>
        </Row>
        <ErrorText>{error}</ErrorText>
        <Button title="Add" onPress={addNewPart} />
      </Card>
    </Screen>
  );
}


// ---------- Services ----------

export function Services({ data, reload, go }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [checks, setChecks] = useState("");
  const [error, setError] = useState("");

  async function addNewService() {
    if (name.trim() === "" || price === "" || hours === "") {
      setError("Please enter a name, price, and hours.");
      return;
    }
    const ok = await save(ownerApi("POST", "/services", {
      name: name.trim(), price: Number(price), hours: Number(hours), checklist: checks.trim()
    }), reload);
    if (ok) { setName(""); setPrice(""); setHours(""); setChecks(""); setError(""); }
  }

  return (
    <Screen title="Services" subtitle="The list customers book from." onBack={() => go("more")}>
      {data.services.map(s => (
        <Card key={s.id}>
          <Row style={{ justifyContent: "space-between" }}>
            <Bold style={{ flex: 1 }}>{s.name}</Bold>
            <Bold>{money(s.price)}</Bold>
          </Row>
          <Muted>{s.hours} hours</Muted>
        </Card>
      ))}
      <Card>
        <H2>Add Service</H2>
        <Field label="Name" value={name} onChangeText={setName} />
        <Row>
          <View style={{ flex: 1 }}><Field label="Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Hours" value={hours} onChangeText={setHours} keyboardType="decimal-pad" /></View>
        </Row>
        <Field label="Included checks (separate with commas)" value={checks} onChangeText={setChecks} />
        <ErrorText>{error}</ErrorText>
        <Button title="Add" onPress={addNewService} />
      </Card>
    </Screen>
  );
}


// ---------- Transactions ----------

export function Transactions({ data, go }) {
  const [invoice, setInvoice] = useState(null);

  const list = data.transactions.slice();
  list.sort((a, b) => b.date.localeCompare(a.date));

  async function viewInvoice(repairId) {
    try {
      setInvoice(await ownerApi("GET", "/repairs/" + repairId));
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  }

  return (
    <Screen title="Transactions" subtitle="Invoices and payments." onBack={() => go("more")}>
      {list.length === 0 ? <Card><Muted>No transactions yet.</Muted></Card> : null}
      {list.map(t => {
        const r = data.repairs.find(x => x.id === t.repair_id);
        return (
          <Card key={t.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <Muted>#{t.id} • {shortDate(t.date)}</Muted>
              <Tag text={t.status} color={t.status === "Paid" ? "green" : "amber"} />
            </Row>
            <Bold style={{ marginTop: 4 }}>{r ? r.customer_name : ""}</Bold>
            <Muted>RO #{t.repair_id}</Muted>
            <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
              <Button title="Invoice" ghost small onPress={() => viewInvoice(t.repair_id)} />
              <Bold style={{ fontSize: 16 }}>{money(t.amount)}</Bold>
            </Row>
          </Card>
        );
      })}
      <InvoiceModal repair={invoice} onClose={() => setInvoice(null)} />
    </Screen>
  );
}


// ---------- Settings ----------

export function Settings({ go }) {
  return (
    <Screen title="Settings" subtitle="Shop details shown to customers and on invoices." onBack={() => go("more")}>
      <Card>
        <Setting label="Shop name" value={SHOP.name} />
        <Setting label="Phone" value={SHOP.phone} />
        <Setting label="Address" value={SHOP.address} />
        <Setting label="Hours" value={SHOP.hours} />
        <Setting label="Sales tax" value={SHOP.taxRate + "%"} />
        <Muted style={{ marginTop: 10 }}>To change these, edit SHOP in mobile/src/api.js (and web/shared/api.js for the website). The tax rate is also set in api/repairs.js.</Muted>
      </Card>
    </Screen>
  );
}

function Setting({ label, value }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Muted>{label}</Muted>
      <Bold>{value}</Bold>
    </View>
  );
}
