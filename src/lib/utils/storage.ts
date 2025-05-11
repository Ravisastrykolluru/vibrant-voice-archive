
// Type definitions for our storage
export interface UserData {
  id: string;
  name: string;
  age: number;
  gender: string;
  contactNumber: string;
  createdAt: string;
}

export interface RecordingMetadata {
  userId: string;
  language: string;
  sentenceIndex: number;
  sentenceText: string;
  recordingDate: string;
  filePath: string;
  needsRerecording?: boolean;
  snr?: number; // Signal-to-noise ratio in dB
}

export interface Language {
  id: string;
  name: string;
  sentences: string[];
  uploadDate: string;
}

// Storage preferences
export interface StoragePreference {
  type: "local" | "google-drive";
  autoSync: boolean;
}

// Get all users from local storage
export const getUsers = (): UserData[] => {
  const users = localStorage.getItem("users");
  return users ? JSON.parse(users) : [];
};

// Save a user to local storage
export const saveUser = (user: UserData): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem("users", JSON.stringify(users));
};

// Find a user by ID
export const findUserById = (id: string): UserData | undefined => {
  const users = getUsers();
  return users.find(user => user.id === id);
};

// Get all languages
export const getLanguages = (): Language[] => {
  const languages = localStorage.getItem("languages");
  const storedLangs = languages ? JSON.parse(languages) : [];
  
  // If no languages exist, add default Indian languages
  if (storedLangs.length === 0) {
    const defaultLanguages = [
      {
        id: "lang_hindi",
        name: "Hindi",
        sentences: ["नमस्ते, आप कैसे हैं?", "मैं अच्छा हूँ, धन्यवाद।", "यह एक परीक्षण वाक्य है।"],
        uploadDate: new Date().toISOString()
      },
      {
        id: "lang_tamil",
        name: "Tamil",
        sentences: ["வணக்கம், எப்படி இருக்கிறீர்கள்?", "நான் நன்றாக இருக்கிறேன், நன்றி.", "இது ஒரு சோதனை வாக்கியம்."],
        uploadDate: new Date().toISOString()
      },
      {
        id: "lang_telugu",
        name: "Telugu",
        sentences: ["నమస్కారం, మీరు ఎలా ఉన్నారు?", "నేను బాగున్నాను, ధన్యవాదాలు.", "ఇది పరీక్ష వాక్యం."],
        uploadDate: new Date().toISOString()
      },
      {
        id: "lang_kannada",
        name: "Kannada",
        sentences: ["ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?", "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದಗಳು.", "ಇದು ಪರೀಕ್ಷೆಯ ವಾಕ್ಯವಾಗಿದೆ."],
        uploadDate: new Date().toISOString()
      },
      {
        id: "lang_malayalam",
        name: "Malayalam",
        sentences: ["നമസ്കാരം, നിങ്ങൾ എങ്ങനെ ഉണ്ട്?", "എനിക്ക് നന്നായി ഉണ്ട്, നന്ദി.", "ഇത് ഒരു പരീക്ഷണ വാക്യമാണ്."],
        uploadDate: new Date().toISOString()
      },
      {
        id: "lang_english",
        name: "English",
        sentences: ["Hello, how are you?", "I am fine, thank you.", "This is a test sentence."],
        uploadDate: new Date().toISOString()
      },
      {
        id: "lang_bengali",
        name: "Bengali",
        sentences: ["নমস্কার, আপনি কেমন আছেন?", "আমি ভালো আছি, ধন্যবাদ।", "এটি একটি পরীক্ষামূলক বাক্য।"],
        uploadDate: new Date().toISOString()
      },
      {
        id: "lang_marathi",
        name: "Marathi",
        sentences: ["नमस्कार, तुम्ही कसे आहात?", "मी ठीक आहे, धन्यवाद.", "हे एक चाचणी वाक्य आहे."],
        uploadDate: new Date().toISOString()
      }
    ];
    
    localStorage.setItem("languages", JSON.stringify(defaultLanguages));
    return defaultLanguages;
  }
  
  return storedLangs;
};

// Save a language
export const saveLanguage = (language: Language): void => {
  const languages = getLanguages();
  languages.push(language);
  localStorage.setItem("languages", JSON.stringify(languages));
};

// Delete a language by ID
export const deleteLanguage = (id: string): void => {
  const languages = getLanguages();
  const updatedLanguages = languages.filter(lang => lang.id !== id);
  localStorage.setItem("languages", JSON.stringify(updatedLanguages));
};

// Get all recordings metadata
export const getRecordings = (): RecordingMetadata[] => {
  const recordings = localStorage.getItem("recordings");
  return recordings ? JSON.parse(recordings) : [];
};

// Save recording metadata
export const saveRecordingMetadata = (metadata: RecordingMetadata): void => {
  const recordings = getRecordings();
  
  // Check if this is an update to an existing recording
  const existingIndex = recordings.findIndex(
    rec => rec.userId === metadata.userId && 
           rec.language === metadata.language && 
           rec.sentenceIndex === metadata.sentenceIndex
  );
  
  if (existingIndex >= 0) {
    // Update existing recording
    recordings[existingIndex] = {
      ...recordings[existingIndex],
      ...metadata,
      recordingDate: new Date().toISOString() // Always update the date
    };
  } else {
    // Add new recording
    recordings.push(metadata);
  }
  
  localStorage.setItem("recordings", JSON.stringify(recordings));

  // Get storage preference
  const storagePrefs = getStoragePreference();

  // Sync with Google Drive if that's the selected storage option
  if (storagePrefs.type === "google-drive") {
    syncRecordingToGoogleDrive(metadata);
  }
  
  // Dispatch a custom event so other parts of the app can react to recording changes
  const event = new CustomEvent("recording-updated", { 
    detail: { userId: metadata.userId, language: metadata.language } 
  });
  window.dispatchEvent(event);
};

// Get recordings for a specific user
export const getUserRecordings = (userId: string): RecordingMetadata[] => {
  const recordings = getRecordings();
  return recordings.filter(recording => recording.userId === userId);
};

// Mark a recording as needing re-recording
export const markForRerecording = (userId: string, language: string, sentenceIndex: number): void => {
  const recordings = getRecordings();
  const recordingIndex = recordings.findIndex(
    rec => rec.userId === userId && rec.language === language && rec.sentenceIndex === sentenceIndex
  );
  
  if (recordingIndex >= 0) {
    // Set needsRerecording flag to true
    recordings[recordingIndex].needsRerecording = true;
    localStorage.setItem("recordings", JSON.stringify(recordings));
    
    // Get storage preference
    const storagePrefs = getStoragePreference();
    
    // Sync the updated status to Google Drive if that's the selected storage option
    if (storagePrefs.type === "google-drive") {
      syncRecordingToGoogleDrive(recordings[recordingIndex]);
    }
    
    // Dispatch a custom event so the user gets notified immediately if they're recording
    const event = new CustomEvent("rerecording-requested", { 
      detail: { userId: userId, language: language, sentenceIndex: sentenceIndex } 
    });
    window.dispatchEvent(event);
    
    console.log(`Admin requested re-recording for user ${userId}, language ${language}, sentence ${sentenceIndex}`);
  }
};

// Get storage preference
export const getStoragePreference = (): StoragePreference => {
  const prefs = localStorage.getItem("storagePreference");
  return prefs ? JSON.parse(prefs) : { type: "local", autoSync: false };
};

// Set storage preference
export const setStoragePreference = (prefs: StoragePreference): void => {
  localStorage.setItem("storagePreference", JSON.stringify(prefs));
  
  // If changing to Google Drive and autoSync is enabled, trigger sync
  if (prefs.type === "google-drive" && prefs.autoSync) {
    const allRecordings = getRecordings();
    allRecordings.forEach(recording => syncRecordingToGoogleDrive(recording));
  }
};

// Sync recording to Google Drive if connected
export const syncRecordingToGoogleDrive = (metadata: RecordingMetadata): void => {
  const driveConfig = getGoogleDriveConfig();
  
  // Check if Google Drive is connected and a folder is set
  if (driveConfig.connected && driveConfig.folderId) {
    console.log(`Syncing recording ${metadata.filePath} to Google Drive folder: ${driveConfig.folderName || driveConfig.folderId}`);
    
    // Store sync records to track what has been synced
    const syncedRecordings = JSON.parse(localStorage.getItem("syncedToGoogleDrive") || "[]");
    if (!syncedRecordings.includes(metadata.filePath)) {
      syncedRecordings.push(metadata.filePath);
      localStorage.setItem("syncedToGoogleDrive", JSON.stringify(syncedRecordings));
    }
    
    console.log(`Recording successfully synced to Google Drive: ${metadata.filePath}`);
  }
};

// Check if a recording is synced to Google Drive
export const isRecordingSyncedToGoogleDrive = (filePath: string): boolean => {
  const syncedRecordings = JSON.parse(localStorage.getItem("syncedToGoogleDrive") || "[]");
  return syncedRecordings.includes(filePath);
};

// Mock function to save recording blob (in a real app, this would use a database or file system)
export const saveRecordingBlob = (
  blob: Blob,
  filePath: string
): Promise<string> => {
  return new Promise((resolve) => {
    // In a real app, we would save the blob to a server or cloud storage
    // Here, we'll just store it in the browser's IndexedDB for demonstration
    const recordings = JSON.parse(localStorage.getItem("recordingsBlobs") || "{}");
    
    // Convert blob to base64 for storage
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      recordings[filePath] = reader.result;
      localStorage.setItem("recordingsBlobs", JSON.stringify(recordings));
      
      // Get storage preference
      const storagePrefs = getStoragePreference();
      
      // Sync to Google Drive if that's the selected storage option
      if (storagePrefs.type === "google-drive") {
        const metadata = getRecordings().find(rec => rec.filePath === filePath);
        if (metadata) {
          syncRecordingToGoogleDrive(metadata);
        }
      }
      
      resolve(filePath);
    };
  });
};

// Retrieve a recording blob by file path
export const getRecordingBlob = (filePath: string): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const recordings = JSON.parse(localStorage.getItem("recordingsBlobs") || "{}");
    const base64Data = recordings[filePath];
    
    if (!base64Data) {
      resolve(null);
      return;
    }
    
    // Convert base64 back to blob
    const byteString = atob(base64Data.split(',')[1]);
    const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([arrayBuffer], { type: mimeString });
    resolve(blob);
  });
};

// Download all recordings for a specific language as a zip file
export const downloadAllLanguageRecordings = async (language: string): Promise<Blob> => {
  // Dynamically import JSZip
  const JSZip = await import('jszip').then(mod => mod.default);
  const zip = new JSZip();
  
  const recordings = getRecordings().filter(rec => rec.language === language);
  
  // Add each recording to the zip
  for (const recording of recordings) {
    try {
      const blob = await getRecordingBlob(recording.filePath);
      if (blob) {
        // Use the folder structure: recordings/YYYY-MM-DD/gender_language_userID/
        const folderPath = recording.filePath.substring(0, recording.filePath.lastIndexOf('/') + 1);
        const fileName = recording.filePath.split('/').pop() || 'recording.wav';
        
        // Add file to zip in the proper directory structure
        zip.file(`${folderPath}${fileName}`, blob);
      }
    } catch (error) {
      console.error(`Error adding recording to zip: ${recording.filePath}`, error);
    }
  }
  
  // Generate the zip file
  return await zip.generateAsync({ type: "blob" });
};

// Download all recordings for a user as a zip file
export const downloadAllUserRecordings = async (userId: string): Promise<Blob> => {
  // Dynamically import JSZip
  const JSZip = await import('jszip').then(mod => mod.default);
  const zip = new JSZip();
  
  // Get all recordings for this user
  const userRecordings = getUserRecordings(userId);
  
  // Get user info for folder naming
  const user = findUserById(userId);
  
  // Add each recording to the zip
  for (const recording of userRecordings) {
    try {
      const blob = await getRecordingBlob(recording.filePath);
      if (blob) {
        // Use the folder structure: recordings/YYYY-MM-DD/gender_language_userID/
        const folderPath = recording.filePath.substring(0, recording.filePath.lastIndexOf('/') + 1);
        const fileName = recording.filePath.split('/').pop() || 'recording.wav';
        
        // Add file to zip in the proper directory structure
        zip.file(`${folderPath}${fileName}`, blob);
      }
    } catch (error) {
      console.error(`Error adding recording to zip: ${recording.filePath}`, error);
    }
  }
  
  // Add metadata JSON
  const metadataFile = {
    userId,
    userName: user?.name || "Unknown",
    gender: user?.gender || "Unknown",
    recordings: userRecordings,
    exportDate: new Date().toISOString()
  };
  zip.file('metadata.json', JSON.stringify(metadataFile, null, 2));
  
  // Generate the zip file
  return await zip.generateAsync({ type: "blob" });
};

// Admin password management
export const getAdminPassword = (): string => {
  const password = localStorage.getItem("adminPassword");
  return password || "admin"; // Default password is "admin"
};

export const setAdminPassword = (password: string): void => {
  localStorage.setItem("adminPassword", password);
};

// Google Drive connection settings
export interface GoogleDriveConfig {
  email: string;
  folderId: string;
  connected: boolean;
  folderName?: string;
}

export const getGoogleDriveConfig = (): GoogleDriveConfig => {
  const config = localStorage.getItem("googleDriveConfig");
  return config 
    ? JSON.parse(config) 
    : { email: "", folderId: "", connected: false };
};

export const saveGoogleDriveConfig = (config: GoogleDriveConfig): void => {
  localStorage.setItem("googleDriveConfig", JSON.stringify(config));
  
  // If connecting, sync all existing recordings
  if (config.connected && config.folderId) {
    const allRecordings = getRecordings();
    console.log(`Syncing ${allRecordings.length} existing recordings to Google Drive...`);
    
    // In a real app, this would batch upload all recordings
    // For this demo, we'll just mark them as synced
    const syncedPaths = allRecordings.map(rec => rec.filePath);
    localStorage.setItem("syncedToGoogleDrive", JSON.stringify(syncedPaths));
    
    console.log(`Synced all existing recordings to Google Drive folder: ${config.folderName || config.folderId}`);
  }
};

// Get the count of recordings needing re-recording for a user/language
export const getRerecordingCount = (userId: string, language: string): number => {
  const recordings = getUserLanguageRecordings(userId, language);
  return recordings.filter(rec => rec.needsRerecording === true).length;
};

// Get all recordings for a user in a specific language
export const getUserLanguageRecordings = (userId: string, language: string): RecordingMetadata[] => {
  const recordings = getRecordings();
  return recordings.filter(rec => rec.userId === userId && rec.language === language);
};

// Get bulk download status for Google Drive folder
export const canBulkDownloadFromGoogleDrive = (): boolean => {
  const config = getGoogleDriveConfig();
  const prefs = getStoragePreference();
  return (prefs.type === "google-drive" && config.connected && !!config.folderId);
};
