// Owner view of the app. Same sections as the owner website:
// Overview, Repairs (and one repair order), Customers, Vehicles, Employees,
// Parts, Services, Transactions, Settings.
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { getToken } from "../api";
import { ownerApi } from "./ownerApi";
import { TabBar, Message } from "../ui";
import OwnerLogin from "./OwnerLogin";
import Overview from "./Overview";
import Repairs from "./Repairs";
import RepairDetail from "./RepairDetail";
import Customers from "./Customers";
import More from "./More";
import { Vehicles, Employees, Parts, Services, Transactions, Settings } from "./ShopPages";

const TABS = [
  { key: "overview", icon: "home", label: "Home" },
  { key: "repairs", icon: "construct", label: "Repairs" },
  { key: "customers", icon: "people", label: "Customers" },
  { key: "more", icon: "menu", label: "More" }
];

export default function OwnerApp({ onExit }) {
  const [loggedIn, setLoggedIn] = useState(!!getToken("owner"));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  // page is the screen showing; tab is the highlighted tab; id is the repair id for "repair"
  const [nav, setNav] = useState({ page: "overview", tab: "overview", id: null });

  // ---------- Load from the API ----------
  async function loadData() {
    setError("");
    try {
      const names = ["repairs", "customers", "vehicles", "employees", "parts", "services", "transactions"];
      const results = await Promise.all(names.map(name => ownerApi("GET", "/" + name)));
      const next = {};
      names.forEach((name, i) => next[name] = results[i]);
      setData(next);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn]);

  // Move to another screen. Screens under More keep the More tab highlighted.
  function go(page, id) {
    const tab = ["overview", "repairs", "customers"].includes(page) ? page
      : page === "repair" ? "repairs" : "more";
    setNav({ page: page, tab: tab, id: id || null });
  }

  if (!loggedIn) return <OwnerLogin onDone={() => setLoggedIn(true)} />;
  if (error) return <Message text={error} onRetry={loadData} />;
  if (!data) return <Message text="Loading..." />;

  // ---------- Pick which screen to show ----------
  const props = { data, reload: loadData, go, onExit };
  const screens = {
    overview: Overview, repairs: Repairs, customers: Customers, more: More,
    vehicles: Vehicles, employees: Employees, parts: Parts, services: Services,
    transactions: Transactions, settings: Settings
  };
  let screen;
  if (nav.page === "repair") screen = <RepairDetail key={nav.id} {...props} id={nav.id} />;
  else {
    const Page = screens[nav.page] || Overview;
    screen = <Page {...props} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{screen}</View>
      <TabBar tabs={TABS} active={nav.tab} onChange={t => go(t)} />
    </View>
  );
}
