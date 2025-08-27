import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// 🔥 Konfiguracja Firebase (wklej swoje dane)
const firebaseConfig = {
  apiKey: "AIzaSyA2y8LrRjna_aALAb2M3EvWXxQ31O1YmxI",
  authDomain: "cid-panel.firebaseapp.com",
  projectId: "cid-panel",
  storageBucket: "cid-panel.firebasestorage.app",
  messagingSenderId: "1082261416682",
  appId: "1:1082261416682:web:b3ed74f583119884860593",
  measurementId: "G-0BB6Z67KKG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sekcje
const authSection = document.getElementById("authSection");
const mainSection = document.getElementById("mainSection");
const agentsBody = document.getElementById("agentsBody");
const profileDiv = document.getElementById("agentProfile");

// Aktualny agent w profilu
let currentAgentId = null;

// Monitorowanie logowania
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authSection.style.display = "none";
    mainSection.style.display = "block";
    loadAgents();
  } else {
    authSection.style.display = "block";
    mainSection.style.display = "none";
  }
});

// Rejestracja
window.registerAgent = async function() {
  const imie = document.getElementById("regImie").value;
  const nazwisko = document.getElementById("regNazwisko").value;
  const ranga = document.getElementById("regRanga").value;
  const poziom = document.getElementById("regPoziom").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "agents", res.user.uid), {
      imie, nazwisko, ranga, poziom,
      szkolenia: []
    });
    alert("Agent zarejestrowany!");
  } catch (e) {
    alert("Błąd: " + e.message);
  }
};

// Logowanie
window.loginAgent = async function() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert("Błąd: " + e.message);
  }
};

// Wylogowanie
window.logout = function() {
  signOut(auth);
};

// Pobieranie agentów
async function loadAgents() {
  agentsBody.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "agents"));
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data.imie}</td>
      <td>${data.nazwisko}</td>
      <td>${data.ranga}</td>
      <td>${data.poziom}</td>
      <td><button onclick=\"openProfile('${docSnap.id}')\">Profil</button></td>
    `;
    agentsBody.appendChild(tr);
  });
}

// Otwieranie profilu
window.openProfile = async function(id) {
  currentAgentId = id;
  const docSnap = await getDoc(doc(db, "agents", id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("profileName").innerText = `${data.imie} ${data.nazwisko}`;
    document.getElementById("profileRank").innerText = `Ranga: ${data.ranga}`;
    document.getElementById("profileLevel").innerText = `Poziom: ${data.poziom}`;

    const ul = document.getElementById("trainingsList");
    ul.innerHTML = "";
    (data.szkolenia || []).forEach(szk => {
      const li = document.createElement("li");
      li.textContent = `${szk.nazwa} - ${szk.zdane ? \"✅ Zdane\" : \"❌ Niezdane\"}`;
      ul.appendChild(li);
    });

    profileDiv.style.display = "block";
  }
};

// Dodawanie szkolenia
window.addTraining = async function() {
  if (!currentAgentId) return;
  const nazwa = document.getElementById("trainingName").value;
  const zdane = document.getElementById("trainingResult").value === "true";

  const docRef = doc(db, "agents", currentAgentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const updated = [...(data.szkolenia || []), { nazwa, zdane }];
    await updateDoc(docRef, { szkolenia: updated });
    openProfile(currentAgentId);
  }
};

// Zamknięcie profilu
window.closeProfile = function() {
  profileDiv.style.display = "none";
  currentAgentId = null;
};
