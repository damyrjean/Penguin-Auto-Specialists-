// More: the rest of the owner sections (same as the website sidebar)
import React from "react";
import { Text } from "react-native";
import { Screen, Card, Row, Icon, Button, colors } from "../ui";

const LINKS = [
  ["vehicles", "car", "Vehicles"],
  ["employees", "person", "Employees"],
  ["parts", "cube", "Parts"],
  ["services", "list", "Services"],
  ["transactions", "card", "Transactions"],
  ["settings", "settings", "Settings"]
];

export default function More({ go, onExit }) {
  return (
    <Screen title="More" subtitle="Shop Owner, Administrator">
      {LINKS.map(link => (
        <Card key={link[0]} onPress={() => go(link[0])}>
          <Row>
            <Icon name={link[1]} size={20} color={colors.blue} />
            <Text style={{ flex: 1, fontSize: 16, fontWeight: "600", color: colors.text }}>{link[2]}</Text>
            <Icon name="chevron-forward" size={18} color={colors.muted} />
          </Row>
        </Card>
      ))}
      <Button title="Log Out" ghost onPress={onExit} />
    </Screen>
  );
}
