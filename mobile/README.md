# Penguin Auto Specialists – Mobile App (Expo)

The same system as the website, on your phone. It uses the same API and database,
so anything done in the app shows up on the website and the other way around.

- **Customer view:** Dashboard, My Repair (status and photo approvals), Book Appointment, Service History, Vehicle Profile, Log In, Create Account
- **Owner view:** Home (Shop Dashboard), Repairs, one Repair Order, Customers, and under More: Vehicles, Employees, Parts, Services, Transactions, Settings

## Run it
1. Start the API on your computer (see `api/README.md`): `cd api`, `npm run dev`.
2. In a second Terminal window:
   ```
   cd mobile
   npm install
   npx expo start
   ```
3. Install **Expo Go** on your phone (App Store or Google Play).
4. Scan the QR code from the Terminal (iPhone: Camera app, Android: Expo Go).

Your phone and computer must be on the same Wi-Fi. The app finds the API on the same
computer Expo Go loaded it from (port 3000), so you don't have to type an address.
When the API is put online, change `API_URL` in `src/api.js`.

## Files
- `App.js` – start screen (Customer or Shop Owner) and the top bar
- `src/api.js` – calls the API, saves logins, formats dates and money
- `src/ui.js` – cards, buttons, tags, inputs, tab bar, invoice pop-up
- `src/customer/` – customer screens
- `src/owner/` – owner screens
