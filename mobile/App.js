// Penguin Auto Specialists mobile app.
// One app with two views, same as the website: Customer and Owner.
// Start it with:  npx expo start   (then scan the QR code with Expo Go)
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { loadTokens, logout, whenLoginExpires } from "./src/api";
import { colors, Icon, Button, Muted, Message } from "./src/ui";
import CustomerApp from "./src/customer/CustomerApp";
import OwnerApp from "./src/owner/OwnerApp";

export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState(null); // null, "customer", or "owner"
  const [resetKey, setResetKey] = useState(0);

  // Load saved logins when the app opens.
  // If a login expires later, reload the view so it shows the login screen.
  useEffect(() => {
    loadTokens().then(() => setReady(true));
    whenLoginExpires(() => setResetKey(k => k + 1));
  }, []);

  // Go back to the start screen
  async function switchView(role) {
    if (role) await logout(role);
    setView(null);
  }

  let content;
  if (!ready) content = <Message text="Loading..." />;
  else if (view === "customer") content = <CustomerApp key={resetKey} onExit={() => switchView("customer")} />;
  else if (view === "owner") content = <OwnerApp key={resetKey} onExit={() => switchView("owner")} />;
  else content = <StartScreen onPick={setView} />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark }} edges={["top", "bottom"]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.logo}><Icon name="car-sport" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Penguin Auto</Text>
            <Text style={styles.brandSub}>
              {view === "owner" ? "Owner" : view === "customer" ? "Customer" : "Specialists"}
            </Text>
          </View>
          {view ? (
            <Pressable onPress={() => setView(null)}>
              <Text style={styles.headerLink}>Switch</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>{content}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// First screen: pick Customer or Owner
function StartScreen({ onPick }) {
  return (
    <View style={styles.start}>
      <Text style={styles.title}>Welcome</Text>
      <Muted style={{ marginBottom: 24 }}>Penguin Auto Specialists, Palm Coast, FL</Muted>
      <Button title="I'm a Customer" onPress={() => onPick("customer")} />
      <View style={{ height: 12 }} />
      <Button title="Shop Owner" ghost onPress={() => onPick("owner")} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.dark },
  logo: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
  brand: { color: "#fff", fontWeight: "700", fontSize: 16 },
  brandSub: { color: colors.darkText, fontSize: 12 },
  headerLink: { color: colors.darkText, fontWeight: "600" },
  start: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "700", color: colors.text }
});
