// check-firebase.cjs
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  authDomain: "bhoomi-crm.firebaseapp.com",
  databaseURL: "https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bhoomi-crm",
  storageBucket: "bhoomi-crm.firebasestorage.app",
  messagingSenderId: "367290130983",
  appId: "1:367290130983:web:48a735e5a2cf7d79b94098"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function check() {
  const crmRef = ref(db, 'lakshya_crm_central_db/leads');
  const snapshot = await get(crmRef);
  if (snapshot.exists()) {
    const leads = snapshot.val();
    console.log(`Found ${leads.length} leads in Firebase.`);
    const stanzin = leads.find(l => l.name === 'Stanzin Dorje');
    if (stanzin) {
      console.log('Stanzin Data:', JSON.stringify(stanzin, null, 2));
    } else {
      console.log('Stanzin not found in Firebase.');
    }
  } else {
    console.log('No leads found in Firebase.');
  }
  process.exit(0);
}

check();
