// Customer Log In and Create Account
import React, { useState } from "react";
import { View } from "react-native";
import { api, setToken } from "../api";
import { Screen, Card, Field, Button, ErrorText, Muted, LinkText, Row } from "../ui";


// ---------- Log In ----------

export function LoginScreen({ onDone, onSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function logIn() {
    try {
      const result = await api("POST", "/login", { email: email.trim(), password: password });
      await setToken("customer", result.token);
      onDone();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Screen title="Log In" subtitle="Penguin Auto Specialists">
      <Card>
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <ErrorText>{error}</ErrorText>
        <Button title="Log In" onPress={logIn} />
        <Row style={{ marginTop: 14 }}>
          <Muted>New here?</Muted>
          <LinkText onPress={onSignUp}>Create an account</LinkText>
        </Row>
      </Card>
    </Screen>
  );
}


// ---------- Create Account ----------

export function RegisterScreen({ onDone, onLogin }) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function createAccount() {
    if (first.trim() === "" || last.trim() === "" || phone.trim() === "" || email.trim() === "" || password === "") {
      setError("Please fill in every field.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      const result = await api("POST", "/register", {
        first_name: first.trim(), last_name: last.trim(), phone: phone.trim(), email: email.trim(), password: password
      });
      await setToken("customer", result.token);
      onDone();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Screen title="Create Your Account" subtitle="Penguin Auto Specialists">
      <Card>
        <Row>
          <View style={{ flex: 1 }}><Field label="First name" value={first} onChangeText={setFirst} /></View>
          <View style={{ flex: 1 }}><Field label="Last name" value={last} onChangeText={setLast} /></View>
        </Row>
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <ErrorText>{error}</ErrorText>
        <Button title="Create Account" onPress={createAccount} />
        <Row style={{ marginTop: 14 }}>
          <Muted>Already have an account?</Muted>
          <LinkText onPress={onLogin}>Log in</LinkText>
        </Row>
      </Card>
    </Screen>
  );
}
