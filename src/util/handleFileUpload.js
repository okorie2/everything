import { getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../../backend/firebase";

export const handleFileUpload = async (file) => {
  const storageRef = ref(storage, "assets/paper.png");
  // Upload the file and metadata
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    },
    (error) => {
      // Handle unsuccessful uploads
      console.error("Upload failed:", error);
    },
    () => {
      // Handle successful uploads on complete
      console.log("Upload successful!");
    }
  );

  // Pause the upload
  // uploadTask.pause();
  // // Resume the upload
  // uploadTask.resume();
  // // Cancel the upload
  // uploadTask.cancel();
};
