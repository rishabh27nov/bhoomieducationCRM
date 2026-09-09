const FIREBASE_URL = 'https://bhoomi-crm-default-rtdb.asia-southeast1.firebasedatabase.app/lakshya_crm_central_db';

const addTemplates = async () => {
  try {
    const res = await fetch(`${FIREBASE_URL}/whatsappSettings.json`);
    const settings = await res.json();
    
    if (settings) {
      let currentTemplates = [];
      if (Array.isArray(settings.templates)) {
        currentTemplates = settings.templates;
      } else if (typeof settings.templates === 'string') {
        currentTemplates = settings.templates.split(',').map(t => t.trim());
      }
      
      const newTemplates = [
        'lakshya_admission_enquiry',
        'last_call_before_challenge_1',
        'final_evening_push__fomo',
        'starts_tomorrow_urgenc',
        'create_pain_around_not_knowing',
        'create_pain_around_not_knowing_actual_performance'
      ];
      
      const merged = Array.from(new Set([...currentTemplates, ...newTemplates]));
      settings.templates = merged;
      
      await fetch(`${FIREBASE_URL}/whatsappSettings.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      console.log('Templates successfully added to Firebase!');
      console.log('Current templates:', merged);
    }
  } catch (e) {
    console.error('Failed', e);
  }
};

addTemplates();
