// hooks/useStorage.js
import { useState, useEffect } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const useStorage = () => {
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStorage(getStorage());
    }
  }, []);

  const uploadImage = async (image) => {
    if (!storage) return null;

    const imageRef = ref(storage, `images/${image.name}`);
    await uploadBytes(imageRef, image);
    return await getDownloadURL(imageRef);
  };

  return uploadImage;
};

export default useStorage;
