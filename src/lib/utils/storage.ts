
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
}

export interface Language {
  id: string;
  name: string;
  sentences: string[];
  uploadDate: string;
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
  return languages ? JSON.parse(languages) : [];
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
  recordings.push(metadata);
  localStorage.setItem("recordings", JSON.stringify(recordings));
};

// Get recordings for a specific user
export const getUserRecordings = (userId: string): RecordingMetadata[] => {
  const recordings = getRecordings();
  return recordings.filter(recording => recording.userId === userId);
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

// Get total storage used (in bytes)
export const getTotalStorageUsed = (): number => {
  const recordings = localStorage.getItem("recordingsBlobs") || "{}";
  return new Blob([recordings]).size;
};

// Generate a random 4-digit user ID
export const generateUserId = (): string => {
  const min = 1000;
  const max = 9999;
  let id = Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Ensure the ID is unique
  const users = getUsers();
  const existingIds = users.map(user => parseInt(user.id));
  
  while (existingIds.includes(id)) {
    id = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  return id.toString();
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
}

export const getGoogleDriveConfig = (): GoogleDriveConfig => {
  const config = localStorage.getItem("googleDriveConfig");
  return config 
    ? JSON.parse(config) 
    : { email: "", folderId: "", connected: false };
};

export const saveGoogleDriveConfig = (config: GoogleDriveConfig): void => {
  localStorage.setItem("googleDriveConfig", JSON.stringify(config));
};
