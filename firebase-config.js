// Configurazione Firebase per Bar Quality
// La configurazione web identifica il progetto: non inserire qui password o chiavi private.
export const firebaseConfig = {
  apiKey: "AIzaSyCqYBJETJq8x1-N8bQTQhopUg7CnJrVEGc",
  authDomain: "bar-quality-admin.firebaseapp.com",
  projectId: "bar-quality-admin",
  storageBucket: "bar-quality-admin.firebasestorage.app",
  messagingSenderId: "925014973928",
  appId: "1:925014973928:web:7d2cbb415e2886d15f985d"
};

// Da sostituire con l'UID dell'account proprietario dopo averlo creato in Firebase Authentication.
export const ADMIN_UID = "K6s09xCSP5WGaHLX990crsaOXYn1";

// Evita di inizializzare Firebase finché la configurazione non è completa.
export const isFirebaseConfigured = () =>
  Object.values(firebaseConfig).every(value => typeof value === "string" && value.length > 0 && !value.startsWith("INSERISCI_"))
  && ADMIN_UID !== "INSERISCI_UID_AMMINISTRATORE";
