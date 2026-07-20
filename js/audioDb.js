class AudioDB {
  constructor() {
    this.dbName = 'WatchOnRepeat_AudioDB';
    this.storeName = 'recordings';
    this.version = 1;
    this.db = null;
    this.initPromise = this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn("IndexedDB not supported or blocked.");
        return reject(new Error("IndexedDB not supported"));
      }

      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = (event) => {
          console.error("IndexedDB error:", event.target.error);
          reject(event.target.error);
        };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          // create store with auto incrementing key
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('videoId', 'videoId', { unique: false });
        }
      };
      } catch(e) {
        console.warn("IndexedDB blocked:", e);
        reject(e);
      }
    });
  }

  async saveRecording(videoId, platform, blob, duration, name, videoTitle, thumbnail) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const record = {
        videoId,
        platform,
        blob, // Storing raw Blob works great in IndexedDB!
        duration,
        name,
        videoTitle,
        thumbnail,
        createdAt: Date.now()
      };

      const request = store.add(record);
      
      request.onsuccess = (event) => {
        resolve(event.target.result); // Returns the generated ID
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  async getAllRecordings() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        resolve(event.target.result || []);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  async deleteRecording(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
}

window.AudioDB = new AudioDB();
