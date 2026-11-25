// Owner Log In (one shared password, OWNER_PASSWORD in api/.env)
import React, { useState } from "react";
import { api, setToken } from "../api";
import { Screen, Card, Field, Button, ErrorText } from "../ui";

export default function OwnerLogin({ onDone }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function logIn() {
    try {
      const result = await api("POST", "/owner/login", { password: password });
      await setToken("owner", result.token);
      onDone();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Screen title="Owner Log In" subtitle="Penguin Auto Specialists">
      <Card>
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <ErrorText>{error}</ErrorText>
        <Button title="Log In" onPress={logIn} />
      </Card>
    </Screen>
  );
}
