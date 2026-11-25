// Building blocks used on every screen: cards, buttons, tags, inputs, the tab bar,
// and the invoice pop-up. Colors match web/shared/styles.css.
import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SHOP, money, shortDate, lineItems } from "./api";

export const colors = {
  dark: "#0f172a",
  darkCard: "#1e293b",
  darkText: "#94a3b8",
  bg: "#f1f3f6",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#475569",
  blue: "#1d4ed8",
  blueSoft: "#e8eefc",
  green: "#059669",
  greenSoft: "#ecfdf5",
  red: "#b91c1c"
};

export const Icon = Ionicons;


// ---------- Screen with a title at the top ----------

export function Screen({ title, subtitle, children, onBack }) {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenInner} keyboardShouldPersistTaps="handled">
      {onBack ? (
        <Pressable onPress={onBack} style={s.back}>
          <Icon name="chevron-back" size={18} color={colors.blue} />
          <Text style={s.link}>Back</Text>
        </Pressable>
      ) : null}
      <Text style={s.h1}>{title}</Text>
      {subtitle ? <Text style={s.muted}>{subtitle}</Text> : null}
      <View style={{ height: 14 }} />
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, onPress }) {
  if (onPress) {
    return <Pressable onPress={onPress} style={[s.card, style]}>{children}</Pressable>;
  }
  return <View style={[s.card, style]}>{children}</View>;
}

export function H2({ children }) {
  return <Text style={s.h2}>{children}</Text>;
}

export function Muted({ children, style }) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}

export function Bold({ children, style }) {
  return <Text style={[s.bold, style]}>{children}</Text>;
}

export function Row({ children, style }) {
  return <View style={[s.row, style]}>{children}</View>;
}

export function Divider() {
  return <View style={s.divider} />;
}


// ---------- Buttons ----------

export function Button({ title, onPress, ghost, small, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.btn, ghost && s.btnGhost, small && s.btnSmall, pressed && { opacity: 0.7 }, style]}>
      <Text style={[s.btnText, ghost && { color: colors.text }, small && { fontSize: 13 }]}>{title}</Text>
    </Pressable>
  );
}

export function LinkText({ children, onPress }) {
  return <Text style={s.link} onPress={onPress}>{children}</Text>;
}


// ---------- Tags ----------

const TAG_COLORS = {
  amber: ["#fef3c7", "#92400e"],
  blue: [colors.blueSoft, colors.blue],
  green: [colors.greenSoft, "#047857"],
  red: ["#fee2e2", colors.red],
  gray: ["#e2e8f0", "#334155"]
};

export function Tag({ text, color }) {
  const [bg, fg] = TAG_COLORS[color] || TAG_COLORS.gray;
  return (
    <View style={[s.tag, { backgroundColor: bg }]}>
      <Text style={[s.tagText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function StatusTag({ status }) {
  const color = { Requested: "amber", Scheduled: "blue", "In Progress": "blue", Ready: "green", Completed: "gray", Cancelled: "red" }[status];
  return <Tag text={status} color={color} />;
}


// ---------- Form inputs ----------

export function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor="#94a3b8" {...props} />
    </View>
  );
}

// A row of buttons where one can be picked (used instead of a dropdown)
// options: [{ value, label }]
export function Choices({ label, options, value, onChange }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={s.wrap}>
        {options.map(o => {
          const on = o.value === value;
          return (
            <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[s.chip, on && s.chipOn]}>
              <Text style={[s.chipText, on && { color: "#fff" }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <Text style={s.error}>{children}</Text>;
}


// ---------- Totals box (subtotal, tax, total) ----------

export function Totals({ repair }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Row style={s.between}><Muted>Subtotal</Muted><Text>{money(repair.subtotal)}</Text></Row>
      <Row style={s.between}><Muted>Tax ({SHOP.taxRate}%)</Muted><Text>{money(repair.tax)}</Text></Row>
      <Row style={[s.between, { marginTop: 6 }]}><Bold>Total</Bold><Bold>{money(repair.total)}</Bold></Row>
    </View>
  );
}

// One line on an estimate or invoice
export function LineItem({ label, amount }) {
  return (
    <Row style={[s.between, s.lineItem]}>
      <Text style={{ flex: 1, paddingRight: 10 }}>{label}</Text>
      <Text>{money(amount)}</Text>
    </Row>
  );
}


// ---------- Invoice pop-up ----------
// repair is a full repair from the API (has services, parts, approvals, subtotal, tax, total)

export function InvoiceModal({ repair, onClose }) {
  if (!repair) return null;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalBack}>
        <View style={s.modal}>
          <ScrollView>
            <Text style={s.h2}>{SHOP.name}</Text>
            <Muted>{SHOP.address}</Muted>
            <Muted>{SHOP.phone}</Muted>
            <Divider />
            <Bold>Invoice for RO #{repair.id}</Bold>
            <Muted>{shortDate(repair.appt_date)}</Muted>
            <Muted>{repair.customer_name}</Muted>
            <Muted>{repair.vehicle_name}</Muted>
            <Divider />
            {lineItems(repair).map((l, i) => (
              <LineItem key={i} label={l.label + (l.qty > 1 ? " x " + l.qty : "")} amount={l.amount} />
            ))}
            <Totals repair={repair} />
          </ScrollView>
          <Button title="Close" ghost onPress={onClose} style={{ marginTop: 14 }} />
        </View>
      </View>
    </Modal>
  );
}


// ---------- Tab bar at the bottom ----------
// tabs: [{ key, icon, label }]

export function TabBar({ tabs, active, onChange }) {
  return (
    <View style={s.tabBar}>
      {tabs.map(t => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} style={s.tab} onPress={() => onChange(t.key)}>
            <Icon name={t.icon} size={22} color={on ? "#fff" : colors.darkText} />
            <Text style={[s.tabText, on && { color: "#fff" }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}


// Shown while loading, or if the API can't be reached
export function Message({ text, onRetry }) {
  return (
    <View style={s.center}>
      <Card style={{ width: "100%" }}>
        <Muted>{text}</Muted>
        {onRetry ? <Button title="Try Again" onPress={onRetry} style={{ marginTop: 12 }} /> : null}
      </Card>
    </View>
  );
}


export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenInner: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: colors.bg },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  h1: { fontSize: 24, fontWeight: "700", color: colors.text },
  h2: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 6 },
  muted: { color: colors.muted, fontSize: 14 },
  bold: { fontWeight: "700", color: colors.text },
  link: { color: colors.blue, fontWeight: "600" },
  card: {
    backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  between: { justifyContent: "space-between" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  lineItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  btn: { backgroundColor: colors.blue, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: "center" },
  btnGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  btnSmall: { paddingVertical: 7, paddingHorizontal: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  tagText: { fontSize: 12, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12,
    fontSize: 15, backgroundColor: "#fff", color: colors.text
  },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#fff" },
  chipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  error: { color: colors.red, marginBottom: 10 },
  modalBack: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: "85%" },
  tabBar: { flexDirection: "row", backgroundColor: colors.dark, paddingTop: 8, paddingBottom: 6 },
  tab: { flex: 1, alignItems: "center", gap: 2 },
  tabText: { fontSize: 11, color: colors.darkText }
});
