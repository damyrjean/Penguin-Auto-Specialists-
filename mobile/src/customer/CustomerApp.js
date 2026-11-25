// Customer view of the app. Same screens as the customer website:
// Dashboard, My Repair, Book Appointment, Service History, Vehicle Profile,
// plus Log In and Create Account.
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { api, getToken } from "../api";
import { TabBar, Message } from "../ui";
import { LoginScreen, RegisterScreen } from "./Login";
import Dashboard from "./Dashboard";
import MyRepair from "./MyRepair";
import Book from "./Book";
import History from "./History";
import Vehicle from "./Vehicle";

const TABS = [
  { key: "dashboard", icon: "home", label: "Dashboard" },
  { key: "repair", icon: "construct", label: "My Repair" },
  { key: "book", icon: "calendar", label: "Book" },
  { key: "history", icon: "time", label: "History" },
  { key: "vehicle", icon: "car", label: "Vehicle" }
];

export default function CustomerApp({ onExit }) {
  const [loggedIn, setLoggedIn] = useState(!!getToken("customer"));
  const [signUp, setSignUp] = useState(false);
  const [data, setData] = useState(null);   // { me, vehicles, repairs, services }
  const [error, setError] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [repairId, setRepairId] = useState(null); // which repair My Repair shows

  // ---------- Load from the API ----------
  async function loadData() {
    setError("");
    try {
      const results = await Promise.all([
        api("GET", "/my/account", null, "customer"),
        api("GET", "/my/vehicles", null, "customer"),
        api("GET", "/my/repairs", null, "customer"),
        api("GET", "/services")
      ]);
      setData({ me: results[0], vehicles: results[1], repairs: results[2], services: results[3] });
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn]);

  // Move to another tab. "params" is the repair id for My Repair.
  function go(nextTab, params) {
    setRepairId(params || null);
    setTab(nextTab);
  }

  // ---------- Not logged in ----------
  if (!loggedIn) {
    if (signUp) {
      return <RegisterScreen
        onDone={() => { setTab("vehicle"); setLoggedIn(true); }} // new customers add their vehicle next
        onLogin={() => setSignUp(false)} />;
    }
    return <LoginScreen onDone={() => setLoggedIn(true)} onSignUp={() => setSignUp(true)} />;
  }

  if (error) return <Message text={error} onRetry={loadData} />;
  if (!data) return <Message text="Loading..." />;

  // ---------- Pick which screen to show ----------
  const props = { data, reload: loadData, go, onExit };
  let screen;
  if (tab === "repair") screen = <MyRepair {...props} repairId={repairId} />;
  else if (tab === "book") screen = <Book {...props} />;
  else if (tab === "history") screen = <History {...props} />;
  else if (tab === "vehicle") screen = <Vehicle {...props} />;
  else screen = <Dashboard {...props} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{screen}</View>
      <TabBar tabs={TABS} active={tab} onChange={t => go(t)} />
    </View>
  );
}
